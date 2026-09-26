// Tests for the data layer: schema, sessions, server-side recomputation, the wall
// and the events. Run:  npm run test:db
//
// Uses a scratch database file that is deleted before and after, so it never
// touches real data. Loads the real lib/ and content code.

import fs from 'node:fs';

const FILE = 'data/test-db.db';
process.env.DATABASE_URL = `file:./${FILE}`;
for (const suffix of ['', '-journal', '-wal', '-shm']) fs.rmSync(FILE + suffix, { force: true });

const { db, closeDb } = await import('../lib/db.ts');
const { ApiError, CREATE_CAP_PER_MINUTE, completeSession, createSession, saveAnswer } = await import('../lib/session.ts');
const { getActiveFestival, setActiveFestival } = await import('../lib/settings.ts');
const { DEFAULT_EVENTS, getEvent, getEventText, setEvent } = await import('../lib/events.ts');
const { bangkokDayStartUtc, demoWallData, getWallData } = await import('../lib/booth-wall.ts');
const { questions } = await import('../content/th/questions.ts');
const { flowerFromChoices, loykrathongQuiz } = await import('../content/th/booth.ts');
const { scoreCheckin } = await import('../lib/scoring.ts');

let fail = 0;
const check = (label, ok, detail = '') => {
  if (!ok) fail += 1;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${!ok && detail ? `\n        ${detail}` : ''}`);
};
const eq = (label, got, want) => check(label, JSON.stringify(got) === JSON.stringify(want), `got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`);
const rejects = async (label, fn, status, code) => {
  try {
    await fn();
    check(label, false, 'did not throw');
  } catch (e) {
    check(label, e instanceof ApiError && e.status === status && e.code === code, `threw ${e?.status} ${e?.code ?? e?.message}`);
  }
};

const c = await db();
const one = async (sql, args = []) => (await c.execute({ sql, args })).rows[0];

// ---- 1. Schema and seed ----
{
  const tables = (await c.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")).rows.map((r) => r.name).sort();
  eq('the six tables exist (VENT’s is a count per minute, never text)', tables.filter((t) => t !== 'sqlite_sequence'), ['answer', 'auth_lock', 'event', 'session', 'setting', 'vent_tick']);
  eq('the live festival is seeded as Loy Krathong', await getActiveFestival(), 'loykrathong');

  // Privacy by construction (BRIEF sections 3 and 12): no column could hold a
  // person. If someone adds one, this fails.
  const columns = [];
  for (const t of ['session', 'answer', 'setting', 'event', 'auth_lock', 'vent_tick']) {
    for (const r of (await c.execute(`PRAGMA table_info(${t})`)).rows) columns.push(`${t}.${r.name}`);
  }
  const forbidden = /(^|\.)(name|student|class|grade|email|phone|ip|ip_address|user_agent|ua|note|comment|text|message|free)/i;
  check('no column could hold a name, an ID, an IP address or free text', !columns.some((x) => forbidden.test(x)), columns.filter((x) => forbidden.test(x)).join(', '));
}

// ---- 2. A check-in, end to end on the server ----
const checkinAnswers = ['d', 'b', 'c', 'b', 'b', 'b', 'd', 'c']; // the brief's reference result
{
  const { id } = await createSession({ mode: 'checkin', device: 'mobile' });
  check('a session id is a UUID', /^[0-9a-f-]{36}$/.test(id));
  const row = await one('SELECT * FROM session WHERE id = ?', [id]);
  eq('it records the mode, the live festival and the device bucket', [row.mode, row.festival, row.device_bucket], ['checkin', 'loykrathong', 'mobile']);
  check('it is unfinished, with no result yet', row.completed_at === null && row.result_state === null);

  await rejects('an unfinished check-in cannot be completed', () => completeSession(id), 409, 'incomplete');

  for (let i = 0; i < 8; i += 1) await saveAnswer(id, questions[i].id, checkinAnswers[i]);
  eq('eight answers are stored', Number((await one('SELECT COUNT(*) n FROM answer WHERE session_id = ?', [id])).n), 8);

  // Changing an answer replaces it: still one row per question, latest wins.
  await saveAnswer(id, questions[0].id, 'a');
  await saveAnswer(id, questions[0].id, 'd');
  eq('answering a question again does not duplicate it', Number((await one('SELECT COUNT(*) n FROM answer WHERE session_id = ? AND question_id = ?', [id, questions[0].id])).n), 1);
  eq('and the latest answer is the one kept', (await one('SELECT choice_id FROM answer WHERE session_id = ? AND question_id = ?', [id, questions[0].id])).choice_id, 'd');

  const done = await completeSession(id);
  const want = scoreCheckin(checkinAnswers.map((cid, i) => ({ questionId: questions[i].id, choiceId: cid })));
  eq('the server recomputes the result from the stored answers', done, { mode: 'checkin', state: want.state, primary: want.primary, secondary: want.secondary });
  eq('and it is the brief\'s reference result', [done.state, done.primary, done.secondary], ['drained', 'study', 'rest']);
  const stored = await one('SELECT * FROM session WHERE id = ?', [id]);
  check('the result and the completion time are stored', stored.completed_at !== null && stored.result_state === 'drained' && stored.primary_topic === 'study' && stored.secondary_topic === 'rest');

  eq('completing twice returns the same result (the phone retries once)', await completeSession(id), done);
  await rejects('a finished session cannot take another answer', () => saveAnswer(id, questions[0].id, 'a'), 409, 'completed');
  eq('and its stored answer did not change', (await one('SELECT choice_id FROM answer WHERE session_id = ? AND question_id = ?', [id, questions[0].id])).choice_id, 'd');
}

// ---- 3. Bad input is refused ----
{
  const { id } = await createSession({ mode: 'checkin' });
  await rejects('an unknown question is refused', () => saveAnswer(id, 'q99-nope', 'a'), 400, 'unknown_answer');
  await rejects('an unknown choice is refused', () => saveAnswer(id, questions[0].id, 'z'), 400, 'unknown_answer');
  await rejects('a booth question is refused on a check-in session', () => saveAnswer(id, loykrathongQuiz[0].id, 'a'), 400, 'unknown_answer');
  await rejects('an unknown session is refused', () => saveAnswer('00000000-0000-4000-8000-000000000000', questions[0].id, 'a'), 404, 'not_found');
  await rejects('so is something that is not even a UUID', () => saveAnswer("1'; DROP TABLE session; --", questions[0].id, 'a'), 404, 'not_found');
  eq('and the session table is still there', Number((await one('SELECT COUNT(*) n FROM session')).n) > 0, true);
}

// ---- 4. A booth session, and the wall ----
{
  const { id } = await createSession({ mode: 'booth', device: 'tablet' });
  const path = [2, 0, 2]; // lively, self, lively -> a known flower
  const pairs = loykrathongQuiz.map((q, i) => ({ questionId: q.id, choiceId: q.choices[path[i]].id }));
  for (const p of pairs) await saveAnswer(id, p.questionId, p.choiceId);
  const want = flowerFromChoices(pairs);
  const done = await completeSession(id);
  eq('a booth result is the flower the content says', done, { mode: 'booth', flower: want.id });
  eq('and it is stored as booth_result', (await one('SELECT booth_result FROM session WHERE id = ?', [id])).booth_result, want.id);

  const wall = await getWallData('loykrathong');
  eq('the wall counts it today and in total', [wall.today, wall.total], [1, 1]);
  eq('the bar for that flower is 1 and the others are 0', wall.flowers.map((f) => f.count), wall.flowers.map((f) => (f.id === want.id ? 1 : 0)));
  eq('the river has that flower', wall.recent.length, 1);
  eq('the wall is real, not a sample', wall.sample, false);
  eq('a check-in never appears on the booth wall', (await getWallData('loykrathong')).total, 1);
  eq('another festival has an empty wall', (await getWallData('christmas')).total, 0);
  check('the demo wall says it is a sample', demoWallData().sample === true);
}

// ---- 5. "Today" is Thailand time ----
{
  // 2026-11-19 16:59:59Z is 23:59:59 in Bangkok; one second later is the next day.
  const at = (iso) => Date.parse(iso);
  eq('16:59:59Z is still the same Bangkok day as 00:00 that morning', bangkokDayStartUtc(at('2026-11-19T16:59:59Z')), at('2026-11-18T17:00:00Z'));
  eq('17:00:00Z starts the next Bangkok day', bangkokDayStartUtc(at('2026-11-19T17:00:00Z')), at('2026-11-19T17:00:00Z'));

  await c.execute("DELETE FROM session");
  const put = async (completedAt, flower) => {
    const id = crypto.randomUUID();
    await c.execute({ sql: "INSERT INTO session (id, mode, festival, started_at, completed_at, booth_result) VALUES (?, 'booth', 'loykrathong', ?, ?, ?)", args: [id, completedAt, completedAt, flower] });
  };
  // Two results on the 19th in Bangkok: noon, and one minute before midnight.
  await put('2026-11-19T05:00:00Z', 'lotus'); // 12:00 Bangkok, 19th
  await put('2026-11-19T16:59:00Z', 'orchid'); // 23:59 Bangkok, 19th
  const beforeMidnight = await getWallData('loykrathong', at('2026-11-19T16:59:30Z'));
  eq('at 23:59:30 Bangkok both results are "today"', [beforeMidnight.today, beforeMidnight.total], [2, 2]);
  const afterMidnight = await getWallData('loykrathong', at('2026-11-19T17:00:30Z'));
  eq('thirty seconds into the 20th Bangkok, "today" is empty but the total is not', [afterMidnight.today, afterMidnight.total], [0, 2]);
  await put('2026-11-19T17:01:00Z', 'marigold'); // 00:01 Bangkok, 20th
  const nextMorning = await getWallData('loykrathong', at('2026-11-20T02:00:00Z'));
  eq('by 09:00 on the 20th, "today" is only the result made after midnight', [nextMorning.today, nextMorning.total], [1, 3]);
  eq('and the river is newest first', nextMorning.recent.map((r) => r.tint), [0, 2, 3]); // marigold 0, orchid 2, lotus 3
}

// ---- 6. The cap on new sessions ----
{
  await c.execute("DELETE FROM session");
  let made = 0;
  for (let i = 0; i < CREATE_CAP_PER_MINUTE; i += 1) {
    await createSession({ mode: 'checkin' });
    made += 1;
  }
  eq(`${CREATE_CAP_PER_MINUTE} sessions in a minute are allowed`, made, CREATE_CAP_PER_MINUTE);
  await rejects('the next one is refused as busy', () => createSession({ mode: 'checkin' }), 429, 'busy');
  await c.execute("DELETE FROM session");
  check('and it stores nothing that identifies the sender', (await c.execute('PRAGMA table_info(session)')).rows.every((r) => !/ip|agent/i.test(r.name)));
}

// ---- 7. Which festival is live ----
{
  await setActiveFestival('christmas');
  eq('the admin can switch the live festival', await getActiveFestival(), 'christmas');
  await rejects('a booth cannot start when that festival has no content yet', () => createSession({ mode: 'booth' }), 409, 'no_booth');
  const { id } = await createSession({ mode: 'checkin' });
  eq('a check-in records the festival it ran under', (await one('SELECT festival FROM session WHERE id = ?', [id])).festival, 'christmas');
  await setActiveFestival('none');
  await rejects('and with none live there is no booth either', () => createSession({ mode: 'booth' }), 409, 'no_booth');
  const { id: id2 } = await createSession({ mode: 'checkin' });
  eq('a check-in with no booth live records no festival', (await one('SELECT festival FROM session WHERE id = ?', [id2])).festival, null);
  await c.execute("UPDATE setting SET value = 'garbage' WHERE key = 'active_festival'");
  eq('a corrupt setting falls back to the default, not an error', await getActiveFestival(), 'loykrathong');
  await setActiveFestival('loykrathong');
  await c.execute("DELETE FROM session");
}

// ---- 8. Events: defaults, overrides, and bad edits ----
{
  eq('with no row, the defaults are used', (await getEventText('loykrathong')).date, '19–20 พ.ย. 2569');
  await setEvent({ festival: 'loykrathong', start: '2026-11-19', end: '2026-11-24', time: '11.00–13.00 น.', place: 'ห้องประชุม' });
  eq('an override changes the date', (await getEventText('loykrathong')).date, '19–24 พ.ย. 2569');
  eq('the time and the place too', [(await getEventText('loykrathong')).time, (await getEventText('loykrathong')).place], ['11.00–13.00 น.', 'ห้องประชุม']);
  eq('other festivals are untouched', (await getEventText('christmas')).date, '8–9 ธ.ค. 2569');
  await c.execute("UPDATE event SET start_date = '2026-13-45', place_text = '   ' WHERE festival = 'loykrathong'");
  const bad = await getEvent('loykrathong');
  eq('a bad stored date falls back to the default for that field', bad.start, DEFAULT_EVENTS.loykrathong.start);
  eq('and a blank place falls back too', bad.place, DEFAULT_EVENTS.loykrathong.place);
  eq('while the good fields keep their edit', bad.end, '2026-11-24');
  await c.execute("DELETE FROM event");
}

// ---- 9. Survives a restart ----
{
  const { id } = await createSession({ mode: 'checkin' });
  closeDb();
  const again = await (await import('../lib/db.ts')).db();
  const row = (await again.execute({ sql: 'SELECT id FROM session WHERE id = ?', args: [id] })).rows[0];
  check('data is still there after the connection is closed and reopened', !!row);
  eq('and the schema and seed are safe to run again', await getActiveFestival(), 'loykrathong');
}

closeDb();
// Best effort: Windows can keep the file locked briefly after the last connection
// closes. It is only a scratch file, and the next run deletes it first.
for (const suffix of ['', '-journal', '-wal', '-shm']) {
  try {
    fs.rmSync(FILE + suffix, { force: true });
  } catch {
    /* left for the next run */
  }
}
console.log(fail ? `\n${fail} FAILED` : '\nall passed');
process.exit(fail ? 1 : 0);
