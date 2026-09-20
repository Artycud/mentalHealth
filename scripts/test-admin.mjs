// Tests for what the admin panel reads and does to the data. Run:  npm run test:admin
//
// Seeds a scratch database with sessions at known moments, including one just after
// midnight in Bangkok (which is still the previous day in UTC), and checks the numbers,
// filters, exports and deletion. Uses a scratch file that is deleted before and after.
import fs from 'node:fs';

const FILE = 'data/test-admin.db';
process.env.DATABASE_URL = `file:./${FILE}`;
const wipeFiles = () => {
  for (const suffix of ['', '-journal', '-wal', '-shm']) {
    try {
      fs.rmSync(FILE + suffix, { force: true });
    } catch {
      /* best effort on Windows */
    }
  }
};
wipeFiles();

const { db, closeDb } = await import('../lib/db.ts');
const A = await import('../lib/admin-data.ts');
const { WIPE_WORD } = await import('../content/th/admin.ts');
const { setEvent } = await import('../lib/events.ts');
const { regenerateBoothPassword, recordFailure } = await import('../lib/auth.ts');
const { getActiveFestival, setActiveFestival } = await import('../lib/settings.ts');

let fail = 0;
const check = (label, ok, detail = '') => {
  if (!ok) fail += 1;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${!ok && detail ? `\n        ${detail}` : ''}`);
};
const eq = (label, got, want) => check(label, JSON.stringify(got) === JSON.stringify(want), `got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`);

const c = await db();
const id = (n) => `${String(n).padStart(8, '0')}-0000-4000-8000-000000000000`;
const add = async (n, s) => {
  await c.execute({
    sql: `INSERT INTO session (id, mode, festival, started_at, completed_at, result_state, primary_topic, secondary_topic, booth_result, device_bucket)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [id(n), s.mode, s.festival ?? 'loykrathong', s.start, s.end ?? null, s.state ?? null, s.primary ?? null, s.secondary ?? null, s.flower ?? null, s.device ?? 'mobile'],
  });
  let t = Date.parse(s.start);
  for (const [q, ch] of s.answers ?? []) {
    t += 5000;
    await c.execute({ sql: 'INSERT INTO answer (session_id, question_id, choice_id, answered_at) VALUES (?, ?, ?, ?)', args: [id(n), q, ch, new Date(t).toISOString()] });
  }
};

// 2026-11-19 11:00 Thai = 04:00Z. 2026-11-20 00:30 Thai = 2026-11-19 17:30Z.
await add(1, { mode: 'checkin', start: '2026-11-19T04:00:00Z', end: '2026-11-19T04:01:40Z', state: 'drained', primary: 'study', secondary: 'rest',
  answers: [['q1-study', 'c'], ['q2-pressure', 'b'], ['q3-sleep', 'd']] });
await add(2, { mode: 'checkin', start: '2026-11-19T17:30:00Z', answers: [['q1-study', 'a'], ['q2-pressure', 'a']] }); // unfinished
await add(3, { mode: 'booth', start: '2026-11-20T04:10:00Z', end: '2026-11-20T04:10:40Z', flower: 'lotus', device: 'tablet',
  answers: [['b1', 'a'], ['b2', 'a'], ['b3', 'a']] });
await add(4, { mode: 'booth', start: '2026-11-20T04:20:00Z', end: '2026-11-20T04:20:20Z', flower: 'marigold', device: 'tablet', answers: [['b1', 'b']] });
await add(5, { mode: 'checkin', start: '2026-11-21T04:00:00Z', end: '2026-11-21T04:01:00Z', state: 'heavy', primary: 'family', secondary: 'friends', answers: [['q1-study', 'c']] });

const NOW = Date.parse('2026-11-20T10:00:00Z'); // 17:00 on the 20th in Thailand

// ---- 1. the filters ----
{
  eq('no filters is no filters', A.parseFilters({}), {});
  eq('valid values are kept', A.parseFilters({ from: '2026-11-19', to: '2026-11-20', mode: 'booth', status: 'done', festival: 'loykrathong', q: 'ABC-12' }),
    { from: '2026-11-19', to: '2026-11-20', mode: 'booth', status: 'done', festival: 'loykrathong', q: 'abc-12' });
  eq('a bad date, mode, status or festival is just not applied', A.parseFilters({ from: '2026-13-40', to: 'tomorrow', mode: 'admin', status: 'x', festival: 'constructor' }), {});
  eq('a repeated parameter uses the first', A.parseFilters({ mode: ['booth', 'checkin'] }), { mode: 'booth' });
  eq('an id search is capped at the length of an id', A.parseFilters({ q: 'a'.repeat(100) }).q.length, 36);
  eq('filters go back into a query string', A.filtersToQuery({ from: '2026-11-19', mode: 'booth' }), '?from=2026-11-19&mode=booth');
  eq('and none gives an empty string', A.filtersToQuery({}), '');
}

// ---- 2. the numbers ----
const all = await A.getAdminData({}, NOW);
{
  eq('five sessions in all', all.summary.total, 5);
  eq('four were finished', all.summary.completed, 4);
  eq('so 80% finish', all.summary.rate, 0.8);
  eq('the median of 20, 40, 60 and 100 seconds is 50', all.summary.medianSeconds, 50);
  eq('the range covers first to last start', [all.summary.first, all.summary.last], ['2026-11-19T04:00:00Z', '2026-11-21T04:00:00Z']);
  eq('per day, on the THAI calendar: 00:30 on the 20th is the 20th, not the 19th', all.perDay,
    [{ day: '2026-11-19', total: 1, completed: 1 }, { day: '2026-11-20', total: 3, completed: 2 }, { day: '2026-11-21', total: 1, completed: 1 }]);
  eq('result states count finished check-ins only', all.states.map((s) => [s.state, s.count]), [['ok', 0], ['thinking', 0], ['drained', 1], ['heavy', 1]]);
  eq('flowers count finished booth sessions', all.flowers.filter((f) => f.count).map((f) => [f.id, f.count]), [['lotus', 1], ['marigold', 1]]);
  eq("today is counted on Thailand's calendar and ignores filters", [(await A.getAdminData({}, NOW)).summary.today, (await A.getAdminData({ mode: 'booth' }, NOW)).summary.today], [3, 3]);
  const q1 = all.checkinQuestions.find((q) => q.id === 'q1-study');
  eq('q1: three answered; two chose c and one chose a, as percentages of those who answered', [q1.answered, q1.choices.find((x) => x.id === 'c').pct, q1.choices.find((x) => x.id === 'a').pct], [3, 67, 33]);
  eq('every choice of a question is listed, even at zero', q1.choices.length, 4);
  const b1 = all.boothQuestions.find((q) => q.id === 'b1');
  eq('the booth questions are counted separately', [b1.answered, b1.choices.filter((x) => x.count).length], [2, 2]);
  eq('percentages of a question add to about 100', q1.choices.reduce((s, x) => s + x.pct, 0), 100);
}

// ---- 3. the filters, applied ----
{
  const n = async (f) => (await A.getAdminData(f, NOW)).summary.total;
  eq('one day, on the Thai calendar (3 sessions on the 20th)', await n({ from: '2026-11-20', to: '2026-11-20' }), 3);
  eq('from a day onwards', await n({ from: '2026-11-20' }), 4);
  eq('up to a day', await n({ to: '2026-11-19' }), 1);
  eq('booth only', await n({ mode: 'booth' }), 2);
  eq('check-in only', await n({ mode: 'checkin' }), 3);
  eq('unfinished only', await n({ status: 'open' }), 1);
  eq('finished only', await n({ status: 'done' }), 4);
  eq('a festival', await n({ festival: 'loykrathong' }), 5);
  eq('a festival with none', await n({ festival: 'christmas' }), 0);
  eq('combined: booth, on the 20th, finished', await n({ mode: 'booth', from: '2026-11-20', to: '2026-11-20', status: 'done' }), 2);
  eq('an id prefix', await n({ q: '00000003' }), 1);
  eq('a prefix that matches nothing', await n({ q: 'ffffffff' }), 0);
  eq('an id search with odd characters matches nothing (and is not run as SQL)', await n({ q: "' or 1=1 --" }), 0);
  const booth = await A.getAdminData({ mode: 'booth' }, NOW);
  eq('filtering to booth empties the check-in question counts', booth.checkinQuestions.every((q) => q.answered === 0), true);
  eq('and leaves the booth ones', booth.boothQuestions.some((q) => q.answered > 0), true);
  const day = await A.getAdminData({ from: '2026-11-20', to: '2026-11-20' }, NOW);
  eq('per-day follows the filter', day.perDay.map((d) => d.day), ['2026-11-20']);
}

// ---- 4. the list ----
{
  eq('newest first', all.sessions.map((s) => s.id), [id(5), id(4), id(3), id(2), id(1)]);
  const s1 = all.sessions.find((s) => s.id === id(1));
  eq('a session shows Thai day, clock, duration and topics', [s1.day, s1.clock, s1.durationSeconds, s1.primary, s1.secondary], ['2026-11-19', '11:00', 100, 'เรื่องเรียน', 'การพักผ่อน']);
  eq('its answers come back in the order given, with Thai labels', s1.answers.map((a) => a.choice), ['การบ้านกับงานกลุ่มเยอะจนล้น', s1.answers[1].choice, s1.answers[2].choice]);
  check('the question is the Thai headline', s1.answers[0].question === 'เรื่องเรียนช่วงนี้เป็นยังไงบ้าง?', s1.answers[0].question);
  const s2 = all.sessions.find((s) => s.id === id(2));
  eq('an unfinished session is listed, with no duration', [s2.completedAt, s2.durationSeconds, s2.day], [null, null, '2026-11-20']);
  eq('a booth session shows the flower by name', all.sessions.find((s) => s.id === id(3)).flower, 'ดอกบัว');
  eq('and its festival by name', all.sessions.find((s) => s.id === id(3)).festivalName, 'ลอยกระทง');
  await c.execute({ sql: 'INSERT INTO answer (session_id, question_id, choice_id, answered_at) VALUES (?, ?, ?, ?)', args: [id(5), 'q-removed', 'z', '2026-11-21T04:00:30Z'] });
  const s5 = (await A.getAdminData({}, NOW)).sessions.find((s) => s.id === id(5));
  eq('an answer to a question no longer in the content shows its id, not a crash', [s5.answers.at(-1).question, s5.answers.at(-1).choice], ['q-removed', 'z']);
  await c.execute({ sql: 'DELETE FROM answer WHERE question_id = ?', args: ['q-removed'] });

  for (let i = 100; i < 100 + A.LIST_LIMIT + 20; i += 1) {
    await c.execute({ sql: "INSERT INTO session (id, mode, festival, started_at) VALUES (?, 'checkin', 'loykrathong', ?)", args: [id(i), new Date(Date.parse('2026-11-22T04:00:00Z') + i * 1000).toISOString()] });
  }
  const big = await A.getAdminData({}, NOW);
  eq(`the list stops at ${A.LIST_LIMIT} but the numbers count all of them`, [big.sessions.length, big.summary.total], [A.LIST_LIMIT, 5 + A.LIST_LIMIT + 20]);
  check('and the list is the NEWEST ones', big.sessions[0].startedAt > big.sessions.at(-1).startedAt);
  await c.execute("DELETE FROM session WHERE id >= '00000100'");
}

// ---- 5. exports ----
{
  const s = await A.sessionsCsv({});
  check('a CSV starts with a byte-order mark so Excel reads the Thai', s.startsWith('﻿'));
  const lines = s.replace('﻿', '').trim().split('\r\n');
  eq('one row per session plus the header', lines.length, 6);
  check('it uses Thai labels and Thai time', lines.some((l) => l.includes('ดอกบัว') && l.includes('2026-11-20 11:10:00')), lines[3]);
  check('oldest first, like a log', lines[1].startsWith(id(1)) && lines[5].startsWith(id(5)));
  eq('the filters apply to the export', (await A.sessionsCsv({ mode: 'booth' })).trim().split('\r\n').length, 3);
  const a = await A.answersCsv({});
  eq('one row per answer plus the header', a.replace('﻿', '').trim().split('\r\n').length, 1 + 3 + 2 + 3 + 1 + 1);
  check('answers carry the question and the choice in Thai', a.includes('เรื่องเรียนช่วงนี้เป็นยังไงบ้าง?') && a.includes('การบ้านกับงานกลุ่มเยอะจนล้น'));
  eq('the filters apply to the answers too', (await A.answersCsv({ mode: 'booth' })).trim().split('\r\n').length, 1 + 3 + 1);
  await c.execute({ sql: 'INSERT INTO answer (session_id, question_id, choice_id, answered_at) VALUES (?, ?, ?, ?)', args: [id(5), 'q-x', '=HYPERLINK("http://x")', '2026-11-21T04:00:30Z'] });
  const inj = await A.answersCsv({ from: '2026-11-21' });
  check('a value that a spreadsheet would run as a formula is defused, and quotes are escaped', inj.includes(`"'=HYPERLINK(""http://x"")"`), inj.split('\r\n').at(-2));
  await c.execute({ sql: 'DELETE FROM answer WHERE question_id = ?', args: ['q-x'] });
  eq('the filename carries the kind and the Thai date', A.exportFilename('answers', NOW), 'cud-mental-health-answers-2026-11-20.csv');
}

// ---- 6. delete and wipe ----
{
  eq('deleting one session removes it', await A.deleteSession(id(2)), 1);
  eq('and its answers', Number((await c.execute({ sql: 'SELECT COUNT(*) AS n FROM answer WHERE session_id = ?', args: [id(2)] })).rows[0].n), 0);
  eq('and only that one', Number((await c.execute('SELECT COUNT(*) AS n FROM session')).rows[0].n), 4);
  eq('deleting it again removes nothing', await A.deleteSession(id(2)), 0);
  eq('a made-up id removes nothing', await A.deleteSession("x'; DROP TABLE session; --"), 0);
  eq('and the table is still there', Number((await c.execute('SELECT COUNT(*) AS n FROM session')).rows[0].n), 4);

  await setEvent({ festival: 'loykrathong', start: '2026-11-19', end: '2026-11-20', time: 'x', place: 'y' });
  await setActiveFestival('christmas');
  await regenerateBoothPassword();
  await recordFailure('admin');
  let refused = false;
  try {
    await A.wipeAll('yes');
  } catch {
    refused = true;
  }
  check('wiping with the wrong word is refused', refused);
  eq('and deletes nothing', Number((await c.execute('SELECT COUNT(*) AS n FROM session')).rows[0].n), 4);
  eq('the right word wipes every session', await A.wipeAll(WIPE_WORD), 4);
  eq('and every answer', Number((await c.execute('SELECT COUNT(*) AS n FROM answer')).rows[0].n), 0);
  eq('the live festival, the dates, the booth account and the lockout all survive it', [
    await getActiveFestival(),
    Number((await c.execute('SELECT COUNT(*) AS n FROM event')).rows[0].n),
    Number((await c.execute("SELECT COUNT(*) AS n FROM setting WHERE key = 'booth_password_hash'")).rows[0].n),
    Number((await c.execute('SELECT COUNT(*) AS n FROM auth_lock')).rows[0].n),
  ], ['christmas', 1, 1, 1]);
  const empty = await A.getAdminData({}, NOW);
  eq('an empty database is a calm zero, not an error', [empty.summary.total, empty.summary.rate, empty.summary.medianSeconds, empty.summary.first, empty.sessions.length], [0, null, null, null, 0]);
}

closeDb();
wipeFiles();
console.log(fail ? `\n${fail} FAILED` : '\nall passed');
process.exit(fail ? 1 : 0);
