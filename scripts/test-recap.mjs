// Tests for the booth recap (the Instagram cards' numbers). Run:  npm run test:recap
//
// Seeds a scratch database with finished and unfinished booth sessions over two
// Thailand days and checks what the recap says, including the privacy guard on the
// honest question. Uses a scratch file that is deleted before and after.
import fs from 'node:fs';

const FILE = 'data/test-recap.db';
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
const R = await import('../lib/recap.ts');

let fail = 0;
const eq = (label, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) fail += 1;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${ok ? '' : `\n        got  ${JSON.stringify(got)}\n        want ${JSON.stringify(want)}`}`);
};

// ---- 1. the pure parts ----
{
  // 05:12Z is 12:12 in Thailand.
  const at = (hhmm) => `2026-11-19T${hhmm}:00Z`;
  eq('the busiest 10 minutes, on the Thai clock', R.peakSlot([at('05:12'), at('05:15'), at('05:19'), at('05:21'), at('04:30')]), { from: '12.10', to: '12.20', count: 3 });
  eq('fewer than 3 in the busiest slot is not worth naming', R.peakSlot([at('05:12'), at('05:15'), at('04:30')]), null);
  eq('a tie goes to the earlier slot', R.peakSlot([at('04:11'), at('04:12'), at('04:13'), at('05:11'), at('05:12'), at('05:13')]).from, '11.10');
  eq('nothing at all is null, not an error', R.peakSlot([]), null);

  eq('the honest question needs 20 answers before it is shown', R.okayTenths({ real: 10, hide: 6, depends: 3 }), null);
  eq('and is then whole tenths', R.okayTenths({ real: 8, hide: 9, depends: 3 }), { answered: 20, hide: 5, depends: 2, real: 4 });
}

// ---- 2. from the database ----
const c = await db();
let n = 0;
const add = async ({ start, end, flower, answers = [], mode = 'booth', festival = 'loykrathong' }) => {
  n += 1;
  const id = `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
  await c.execute({
    sql: `INSERT INTO session (id, mode, festival, started_at, completed_at, booth_result, device_bucket)
          VALUES (?, ?, ?, ?, ?, ?, 'tablet')`,
    args: [id, mode, festival, start, end ?? null, flower ?? null],
  });
  let t = Date.parse(start);
  for (const [q, ch] of answers) {
    t += 2000;
    await c.execute({ sql: 'INSERT INTO answer (session_id, question_id, choice_id, answered_at) VALUES (?, ?, ?, ?)', args: [id, q, ch, new Date(t).toISOString()] });
  }
};

// Day 1 (19th): 22 finished, every one answering the honest question (12 hide, 4 depends, 6 real).
for (let i = 0; i < 22; i += 1) {
  const start = new Date(Date.parse('2026-11-19T05:00:00Z') + i * 60_000).toISOString();
  const end = new Date(Date.parse(start) + 60_000).toISOString();
  const ok = i < 12 ? 'hide' : i < 16 ? 'depends' : 'real';
  await add({ start, end, flower: i % 3 === 0 ? 'lotus' : 'marigold', answers: [['energy', i % 2 ? 'low' : 'mid'], ['weight', 'mid'], ['topic', 'study'], ['ok', ok]] });
}
// One unfinished on day 1, which counts for nothing.
await add({ start: '2026-11-19T05:40:00Z', answers: [['energy', 'high'], ['ok', 'hide']] });
// Day 2 (20th): 3 finished; the honest question too few to show.
for (let i = 0; i < 3; i += 1) {
  const start = new Date(Date.parse('2026-11-20T04:00:00Z') + i * 120_000).toISOString();
  await add({ start, end: new Date(Date.parse(start) + 90_000).toISOString(), flower: 'lotus', answers: [['energy', 'high'], ['ok', 'real']] });
}
// A check-in on day 1, which is not the booth's.
await add({ start: '2026-11-19T05:10:00Z', end: '2026-11-19T05:12:00Z', mode: 'checkin', festival: 'loykrathong' });

{
  const d1 = await R.getRecap('loykrathong', '2026-11-19');
  eq('the days with a finished booth session', d1.days, ['2026-11-19', '2026-11-20']);
  eq('one day counts only its finished booth sessions', d1.players, 22);
  eq('the date label is that day', d1.dateLabel, '19 พ.ย. 2569');
  eq('flowers are sorted, most first, as shares of the day', d1.flowers.slice(0, 2).map((f) => [f.id, f.count, f.pct]), [['marigold', 14, 64], ['lotus', 8, 36]]);
  eq('the busiest 10 minutes (finishes from 12.01 to 12.22)', d1.peak, { from: '12.10', to: '12.20', count: 10 });
  eq('every player took a minute', d1.medianSeconds, 60);
  const energy = d1.questions.find((q) => q.id === 'energy');
  eq('the feeling questions are counted per choice', [energy.answered, energy.choices.map((ch) => ch.count)], [22, [11, 11, 0]]);
  const topic = d1.questions.find((q) => q.id === 'topic');
  eq('and the topic, with every choice listed', [topic.answered, topic.choices.length, topic.choices[0].count], [22, 9, 22]);
  eq('the honest question, as tenths, with its base', d1.okay, { answered: 22, hide: 5, depends: 2, real: 3 });
  eq('the next booth after Loy Krathong', d1.next?.name, 'คริสต์มาส');

  const d2 = await R.getRecap('loykrathong', '2026-11-20');
  eq('the second day on its own', d2.players, 3);
  eq('with too few answers, the honest question is not shown', d2.okay, null);
  eq('three finishing in one slot is just enough to name it', d2.peak, { from: '11.00', to: '11.10', count: 3 });

  const all = await R.getRecap('loykrathong', null);
  eq('every day of the booth', [all.players, all.day, all.dateLabel], [25, null, '19–20 พ.ย. 2569']);

  const none = await R.getRecap('christmas', null);
  eq('a booth with no sessions is a calm zero', [none.players, none.okay, none.peak, none.days], [0, null, null, []]);
}

closeDb();
wipeFiles();
console.log(fail ? `\n${fail} FAILED` : '\nall passed');
process.exit(fail ? 1 : 0);
