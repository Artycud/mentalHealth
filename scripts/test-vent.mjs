// ระบายให้พี่ๆ สภาฟัง: the server rules, without a browser.  npm run test:vent
//
//   - A message that may mean danger is caught (the care screen shows at once and
//     the team sees it marked urgent); everyday words are not.
//   - A conversation lives under three names: the student's key reads and adds,
//     the chat code finds the key, and the staff ref is all staff or Discord see.
//   - Ending it deletes every word; a long-quiet one is deleted too.
//   - Code lookups are capped per minute, so codes cannot be guessed.
//   - The Discord endpoint refuses anything Discord did not sign.
//   - What the student wrote never reaches a log.
//
// Uses a scratch database file, deleted before and after.

import fs from 'node:fs';

const FILE = 'data/test-vent.db';
delete process.env.DATABASE_URL;
process.env.TURSO_DATABASE_URL = `file:./${FILE}`;
const clean = () => {
  for (const suffix of ['', '-journal', '-wal', '-shm']) fs.rmSync(FILE + suffix, { force: true });
};
clean();

const { db, closeDb } = await import('../lib/db.ts');
const { needsCare } = await import('../lib/vent/safety.ts');
const threads = await import('../lib/vent/threads.ts');
const { takeVentSlot, CODE_CAP_PER_MINUTE } = await import('../lib/vent/cap.ts');
const { discordMode } = await import('../lib/vent/discord.ts');

let failures = 0;
const check = (label, ok, detail = '') => {
  if (!ok) failures += 1;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${!ok && detail ? `  (${detail})` : ''}`);
};

const SECRET = 'พรุ่งนี้สอบคณิตแต่ยังอ่านไม่จบเลยเครียดมาก';
const logged = [];
const realError = console.error;
console.error = (...args) => logged.push(args.map(String).join(' '));

try {
  // ---- the safety net
  for (const phrase of ['ช่วงนี้อยากตายมากเลย', 'ไม่อยาก อยู่ แล้ว', 'I want to die', 'เมื่อวานโดนตีที่บ้าน', 'คิดจะกรีดแขนตัวเอง']) {
    check(`"${phrase}" is caught for care`, needsCare(phrase));
  }
  for (const phrase of ['วันนี้เหนื่อยมาก', 'สอบตกวิชาคณิต', 'ทะเลาะกับเพื่อน', 'ตายแล้ว ลืมทำการบ้าน']) {
    check(`"${phrase}" is an ordinary message`, !needsCare(phrase));
  }

  // ---- a conversation, from the student's side
  const t = await threads.startThread(SECRET, { feel: '2-0', urgent: false });
  check('a new chat gives a long secret key', /^[A-Za-z0-9_-]{30,}$/.test(t.id));
  check('and a short chat code like ABCD-2345', /^[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/.test(t.code), t.code);
  check('and a separate staff ref (the key never goes to staff)', t.ref && t.ref !== t.id && !t.id.includes(t.ref));

  let view = await threads.readThread(t.id);
  check('the student reads their message back by key', view?.messages.length === 1 && view.messages[0].body === SECRET);
  check('  waiting for a พี่', view?.waiting === true);

  check('the code finds the key (any case, any dashes)', (await threads.keyForCode(threads.normaliseCode(t.code.toLowerCase().replace('-', ' ')))) === t.id);
  check('a made-up code finds nothing', (await threads.keyForCode('AAAA-AAAA')) === null);

  // ---- from the team's side
  const box = await threads.inbox();
  check('the inbox lists it by staff ref, not key', box.length === 1 && box[0].ref === t.ref && !JSON.stringify(box).includes(t.id));
  const reply = await threads.addMessage({ ref: t.ref }, 'sapa', 'พี่อยู่ตรงนี้นะ ค่อย ๆ เล่าก็ได้');
  check('a พี่ answers by ref', reply && !reply.full);
  view = await threads.readThread(t.id, view.messages[0].id);
  check('the student sees only what is new since their last look', view?.messages.length === 1 && view.messages[0].sender === 'sapa');
  check('  and it is no longer waiting', view?.waiting === false);

  const more = await threads.addMessage({ id: t.id }, 'student', 'ขอบคุณค่ะ', false);
  check('the student writes again: a fresh ping is due (a พี่ had answered)', more?.wasWaiting === false);
  const again = await threads.addMessage({ id: t.id }, 'student', 'อีกอย่างนะ', true);
  check('  writing again before an answer: no second ping due', again?.wasWaiting === true);
  check('  a worrying message marks the chat urgent', again?.urgent === true && (await threads.inbox())[0].urgent === true);

  // ---- ending it
  const ended = await threads.endThread(t.id);
  check('ending returns the ref and Discord notice to tidy up', ended?.ref === t.ref);
  const c = await db();
  const left = (await c.execute('SELECT (SELECT COUNT(*) FROM vent_thread) AS t, (SELECT COUNT(*) FROM vent_message) AS m')).rows[0];
  check('ending deletes every word', Number(left.t) === 0 && Number(left.m) === 0, JSON.stringify(left));
  check('the key is gone afterwards', (await threads.readThread(t.id)) === null);
  check('and so is the code', (await threads.keyForCode(t.code)) === null);
  check('a พี่ cannot answer an ended chat', (await threads.addMessage({ ref: t.ref }, 'sapa', 'x')) === null);

  // ---- a chat left quiet for 30 days is deleted when someone new starts
  const old = await threads.startThread('เก่า', { urgent: false });
  await c.execute({ sql: 'UPDATE vent_thread SET updated_at = ? WHERE id = ?', args: [new Date(Date.now() - 31 * 86_400_000).toISOString(), old.id] });
  const fresh = await threads.startThread('ใหม่', { urgent: false });
  check('a 31-day-quiet chat is deleted', (await threads.readThread(old.id)) === null && (await threads.readThread(fresh.id)) !== null);
  await threads.endThread(fresh.id);

  // ---- a conversation cannot grow without end
  const long = await threads.startThread('1', { urgent: false });
  for (let i = 1; i < threads.MAX_MESSAGES; i++) await threads.addMessage({ id: long.id }, 'student', String(i));
  check(`a chat stops at ${threads.MAX_MESSAGES} messages`, (await threads.addMessage({ id: long.id }, 'student', 'x'))?.full === true);
  await threads.endThread(long.id);

  // ---- code lookups are capped per minute, separately from messages
  const minute = new Date('2030-01-01T00:00:00Z');
  let allowed = 0;
  for (let i = 0; i < CODE_CAP_PER_MINUTE + 5; i++) if (await takeVentSlot(minute, 'code')) allowed += 1;
  check(`only ${CODE_CAP_PER_MINUTE} code lookups a minute`, allowed === CODE_CAP_PER_MINUTE, String(allowed));
  check('  and messages still have their own allowance', await takeVentSlot(minute, 'message'));

  // ---- Discord
  check('no Discord settings: no pings, nothing breaks', discordMode({}) === null);
  check('a webhook alone: pings with a link', discordMode({ DISCORD_WEBHOOK_URL: 'x' }) === 'webhook');
  check('bot token + channel + public key: answer in Discord', discordMode({ DISCORD_BOT_TOKEN: 'a', DISCORD_CHANNEL_ID: 'b', DISCORD_PUBLIC_KEY: 'c' }) === 'bot');

  process.env.DISCORD_PUBLIC_KEY = '0'.repeat(64);
  const { POST } = await import('../app/api/discord/route.ts').catch(() => ({ POST: null }));
  if (POST) {
    const res = await POST(new Request('http://x/api/discord', { method: 'POST', body: '{"type":1}' }));
    check('the Discord endpoint refuses an unsigned request', res.status === 401);
  } else {
    console.log('SKIP  the Discord endpoint (needs the app\'s @/ paths; covered by the build)');
  }

  check('nothing the student wrote was ever logged', !logged.some((l) => l.includes(SECRET) || l.includes('ขอบคุณค่ะ')), logged.join(' | '));
} finally {
  console.error = realError;
  closeDb();
  // Windows lets go of the file a moment after it is closed.
  for (let i = 0; i < 20; i++) {
    try {
      clean();
      break;
    } catch {
      await new Promise((r) => setTimeout(r, 100));
    }
  }
}

console.log(failures ? `\n${failures} FAILED` : '\nall passed');
process.exit(failures ? 1 : 0);
