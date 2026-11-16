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
const { discordMode, testDiscord } = await import('../lib/vent/discord.ts');

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

  await threads.addMessage({ ref: t.ref }, 'sapa', 'อีกข้อความ');
  const counts = Object.fromEntries((await (await db()).execute('SELECT key, SUM(count) AS n FROM tally GROUP BY key')).rows.map((r) => [r.key, Number(r.n)]));
  check('the recap counts the chat and its first answer (fast), once each', counts['vent:chats'] === 1 && counts['vent:replied'] === 1 && counts['vent:within3'] === 1, JSON.stringify(counts));

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
  check('a webhook pasted with spaces, a line break or quotes still counts', discordMode({ DISCORD_WEBHOOK_URL: '  "https://discord.com/api/webhooks/1/x"' + String.fromCharCode(10) }) === 'webhook');
  check('an empty or blank setting is "not set", not a broken ping', discordMode({ DISCORD_WEBHOOK_URL: '   ' }) === null);
  process.env.DISCORD_WEBHOOK_URL = ' https://example.com/not-a-webhook ';
  check('the admin test says plainly when the address is not a Discord webhook', (await testDiscord('http://x')).reason === 'bad_url');
  delete process.env.DISCORD_WEBHOOK_URL;
  check('  and when nothing is set up at all', (await testDiscord('http://x')).reason === 'not_set');

  // ---- Pings: every message, a burst merged into one, the queue in each
  {
    const { notifySapa, sweepQueue } = await import('../lib/vent/discord.ts');
    const calls = [];
    let nextId = 100;
    const realFetch = globalThis.fetch;
    globalThis.fetch = async (url, init) => {
      const body = JSON.parse(init.body);
      calls.push({ url: String(url), method: init.method, body });
      return Response.json({ id: init.method === 'PATCH' ? String(url).split('/').pop() : String(nextId++) });
    };
    const posts = () => calls.filter((x) => x.method === 'POST');
    const last = () => calls.at(-1);
    process.env.DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1/x';
    process.env.DISCORD_OVERDUE_USER_IDS = ' 111111111111111111, 222222222222222222 ';
    const c = await db();
    await c.execute("DELETE FROM setting WHERE key LIKE 'discord_%'");
    const start = async (text, urgent = false) => {
      const th = await threads.startThread(text, { urgent });
      await notifySapa({ ref: th.ref, urgent, isNew: true, origin: 'http://x' });
      return th;
    };
    const a = await start('ข้อความลับหนึ่ง');
    check('a new chat pings, with the queue size, longest and average wait', posts().length === 1 && /รอตอบ 1 แชท · รอนานสุด .+ · เฉลี่ย /.test(posts()[0].body.content), posts()[0]?.body.content);
    for (let i = 0; i < 4; i++) await start('ข้อความลับอีก');
    check('  four more within a minute: merged into that one ping (edited, not posted)', posts().length === 1 && last().method === 'PATCH' && last().url.endsWith('/messages/100'));
    check('  which now counts them and the queue', last().body.content.includes('ข้อความใหม่ 5 ข้อความ') && last().body.content.includes('รอตอบ 5 แชท'), last().body.content);
    await start('ข้อความลับสาม', true);
    check('an urgent one posts its own ping at once, marked ด่วน', posts().length === 2 && last().body.content.includes('**ด่วน**') && last().body.content.includes('(ด่วน 1)'), last().body.content);
    await c.execute({ sql: "UPDATE setting SET value = ? WHERE key = 'discord_ping_at'", args: [String(Date.now() - 61_000)] });
    await threads.addMessage({ id: a.id }, 'student', 'ข้อความลับสี่');
    await notifySapa({ ref: a.ref, urgent: false, isNew: false, origin: 'http://x' });
    check('a message a minute after the last ping posts a new one', posts().length === 3 && last().body.content.includes('น้องพิมพ์เพิ่ม'));
    await notifySapa({ ref: a.ref, urgent: false, isNew: false, origin: 'http://x' });
    check('  the same chat again: "น้องพิมพ์มา 2 ข้อความ", still pointing at that chat', last().method === 'PATCH' && last().body.content.includes('น้องพิมพ์มา 2 ข้อความ') && last().body.content.includes(`t=${a.ref}`), last().body.content);
    check('  no check while nobody has waited 30 minutes', (await sweepQueue('http://x', true)) === 'idle');
    await c.execute({ sql: 'UPDATE vent_message SET created_at = ? WHERE thread_id = ?', args: [new Date(Date.now() - 31 * 60_000).toISOString(), a.id] });
    const before = posts().length;
    check(
      'a chat waiting 30+ minutes tags the two named people (not @everyone), saying how long',
      (await sweepQueue('http://x', true)) === 'overdue' &&
        posts().length === before + 1 &&
        last().body.content.startsWith('<@111111111111111111> <@222222222222222222> ') &&
        JSON.stringify(last().body.allowed_mentions.users) === '["111111111111111111","222222222222222222"]' &&
        /รอนานสุด 3\d นาที/.test(last().body.content),
      last()?.body.content,
    );
    check('  once per 30 minutes, not on every check', (await sweepQueue('http://x', true)) === 'idle' && posts().length === before + 1);
    check('  no ping ever tags everyone', calls.every((x) => x.body.allowed_mentions.parse.length === 0 && !x.body.content.includes('@everyone')));
    check('  no ping carries what a student wrote', !calls.some((x) => x.body.content.includes('ข้อความลับ')));
    globalThis.fetch = realFetch;
    delete process.env.DISCORD_WEBHOOK_URL;
    delete process.env.DISCORD_OVERDUE_USER_IDS;
  }

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
