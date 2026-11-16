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
const { bump } = await import('../lib/tally.ts');

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

  const m = (o) => new Map(Object.entries(o));
  eq('the top topic needs 5 check-ups that picked one', R.topTopic(m({ 'checkup:topics': 4, 'topic:เรื่องเรียน': 4 })), null);
  eq('and is then the most picked, as a share of them', R.topTopic(m({ 'checkup:topics': 20, 'topic:เรื่องเรียน': 13, 'topic:เพื่อน': 6 })), { name: 'เรื่องเรียน', pct: 65, base: 20 });
  eq('ระบาย needs 3 chats before its numbers show', R.ventCounts(m({ 'vent:chats': 2, 'vent:replied': 2 })), null);
  eq('and then shows chats, answered and answered fast', R.ventCounts(m({ 'vent:chats': 7, 'vent:replied': 6, 'vent:within3': 4 })), { chats: 7, replied: 6, within3: 4, medianMin: null });
  eq('open chats count too (from before the counters began), with their median reply time', R.ventCounts(m({ 'vent:chats': 1 }), [{ replyMin: 1 }, { replyMin: 2.2 }, { replyMin: 9 }, { replyMin: null }]), { chats: 4, replied: 3, within3: 2, medianMin: 2 });
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
  await add({ start, end, flower: i % 3 === 0 ? 'hydrangea' : 'sunflower', answers: [['q1', i % 2 ? 'sad' : 'happy'], ['q2', 'love'], ['q5', 'happy'], ['ok', ok]] });
}
// One unfinished on day 1, which counts for nothing.
await add({ start: '2026-11-19T05:40:00Z', answers: [['q1', 'excited'], ['ok', 'hide']] });
// Day 2 (20th): 3 finished; the honest question too few to show.
for (let i = 0; i < 3; i += 1) {
  const start = new Date(Date.parse('2026-11-20T04:00:00Z') + i * 120_000).toISOString();
  await add({ start, end: new Date(Date.parse(start) + 90_000).toISOString(), flower: 'hydrangea', answers: [['q1', 'excited'], ['ok', 'real']] });
}
// A check-in on day 1, which is not the booth's.
await add({ start: '2026-11-19T05:10:00Z', end: '2026-11-19T05:12:00Z', mode: 'checkin', festival: 'loykrathong' });

// The check-up's topics and ระบาย, counted by day (lib/tally.ts). 23.30Z on the 18th is the 19th in Thailand.
for (let i = 0; i < 12; i += 1) await bump(['checkup:topics', 'topic:เรื่องเรียน', ...(i < 5 ? ['topic:การนอน'] : [])], '2026-11-19T03:00:00Z');
for (let i = 0; i < 6; i += 1) await bump(['vent:chats'], '2026-11-18T23:30:00Z');
await bump(['vent:replied', 'vent:within3'], '2026-11-19T03:00:00Z');
await bump(['vent:chats'], '2026-11-20T03:00:00Z');
// Four chats still open from the 20th (Thailand: 19.00Z on the 19th is 02.00 on the 20th), three answered in 2 minutes.
for (let i = 0; i < 4; i += 1) {
  const at = new Date(Date.parse('2026-11-19T19:00:00Z') + i * 60_000);
  await c.execute({ sql: "INSERT INTO vent_thread (id, code, ref, created_at, updated_at) VALUES (?, ?, ?, ?, ?)", args: [`k${i}`, `C${i}`, `r${i}`, at.toISOString(), at.toISOString()] });
  if (i < 3) await c.execute({ sql: "INSERT INTO vent_message (thread_id, sender, body, created_at) VALUES (?, 'sapa', 'x', ?)", args: [`k${i}`, new Date(at.getTime() + 120_000).toISOString()] });
}

{
  const d1 = await R.getRecap('loykrathong', '2026-11-19');
  eq('the top three feelings, as the flowers people got', d1.feelings.map((f) => [f.word, f.pct]), [['ความสุข', 64], ['ความเศร้า', 36]]);
  eq('the check-up topic of the day', d1.topic, { name: 'เรื่องเรียน', pct: 100, base: 12 });
  eq('ระบาย on the Thailand day', d1.vent, { chats: 6, replied: 1, within3: 1, medianMin: null });
  eq('4 in 10 carry something heavy (8 of 22 got the sad flower)', d1.heavy, { tenths: 4, count: 8 });
  eq('the quoted answers: what they would float away, and change', d1.quotes.map((q) => [q.id, q.pct]), [['q1', 50]]);
  eq('the days with a finished booth session', d1.days, ['2026-11-19', '2026-11-20']);
  eq('one day counts only its finished booth sessions', d1.players, 22);
  eq('the date label is that day', d1.dateLabel, '19 พ.ย. 2569');
  eq('flowers are sorted, most first, as shares of the day', d1.flowers.slice(0, 2).map((f) => [f.id, f.count, f.pct]), [['sunflower', 14, 64], ['hydrangea', 8, 36]]);
  eq('the busiest 10 minutes (finishes from 12.01 to 12.22)', d1.peak, { from: '12.10', to: '12.20', count: 10 });
  eq('every player took a minute', d1.medianSeconds, 60);
  const q1 = d1.questions.find((q) => q.id === 'q1');
  eq('the questions are counted per choice', [q1.answered, q1.choices.map((ch) => ch.count)], [22, [11, 11, 0, 0, 0, 0]]);
  const q5 = d1.questions.find((q) => q.id === 'q5');
  eq('with every choice listed', [q5.answered, q5.choices.length, q5.choices[0].count], [22, 6, 22]);
  eq('the honest question, as tenths, with its base', d1.okay, { answered: 22, hide: 5, depends: 2, real: 3 });
  eq('the next booth after Loy Krathong', d1.next?.name, 'คริสต์มาส');

  const d2 = await R.getRecap('loykrathong', '2026-11-20');
  eq('the second day on its own', d2.players, 3);
  eq('with too few answers, the honest question is not shown', d2.okay, null);
  eq('too few check-ups show no topic', d2.topic, null);
  eq('chats still open count on their Thailand day, with the median first answer', d2.vent, { chats: 4, replied: 3, within3: 3, medianMin: 2 });
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
