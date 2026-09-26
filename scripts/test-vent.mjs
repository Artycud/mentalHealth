// VENT's server rules, without a browser or a real AI:  npm run test:vent
//
//   - A message that may mean danger gets the reviewed care screen, and the AI is
//     never even asked.
//   - Whatever the AI answers is checked: malformed or late answers become "not
//     available", never a broken page; a "heard" quote that is not really the
//     student's words is dropped; the AI's own "urgent" also means care.
//   - What the student wrote never reaches a log, even when everything fails.
//   - Production never falls back to the template stand-in.
import { respond } from '../lib/vent/respond.ts';
import { needsCare } from '../lib/vent/safety.ts';
import { mockProvider } from '../lib/vent/mock.ts';
import { getProvider } from '../lib/vent/provider.ts';

let failures = 0;
const check = (label, ok, detail = '') => {
  if (!ok) failures += 1;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${!ok && detail ? `  (${detail})` : ''}`);
};

const SECRET = 'พรุ่งนี้สอบคณิตแต่ยังอ่านไม่จบเลยเครียดมาก';
const ask = (text) => ({ messages: [{ role: 'user', text }] });
const fake = (answer, mock = false) => {
  const provider = { mock, calls: 0, async respond() { provider.calls += 1; return typeof answer === 'function' ? answer() : answer; } };
  return provider;
};

// Everything logged while the tests run, to prove the student's words never are.
const logged = [];
const realError = console.error;
console.error = (...args) => logged.push(args.map(String).join(' '));

try {
  // ---- the safety net comes first
  for (const phrase of ['ช่วงนี้อยากตายมากเลย', 'ไม่อยาก อยู่ แล้ว', 'I want to die', 'เมื่อวานโดนตีที่บ้าน', 'คิดจะกรีดแขนตัวเอง']) {
    const ai = fake({ reply: ['ok'], risk: 'none' });
    const out = await respond(ask(phrase), ai);
    check(`"${phrase}" goes to the care screen`, out.kind === 'care', JSON.stringify(out));
    check('  and the AI was never asked', ai.calls === 0);
  }
  for (const phrase of ['วันนี้เหนื่อยมาก', 'สอบตกวิชาคณิต', 'ทะเลาะกับเพื่อน', 'ตายแล้ว ลืมทำการบ้าน']) {
    check(`"${phrase}" is an ordinary message`, !needsCare(phrase));
  }

  // ---- what the AI says is checked
  {
    const ai = fake({ heard: 'ยังอ่านไม่จบ', reply: ['line one', 'line two'], feeling: 'tense', risk: 'none' });
    const out = await respond(ask(SECRET), ai);
    check('a good answer comes through', out.kind === 'reply' && out.lines.length === 2 && out.feeling === 'tense');
    check('  with the words it heard, which really are the student\'s', out.heard === 'ยังอ่านไม่จบ');
  }
  {
    const out = await respond(ask(SECRET), fake({ heard: 'ไม่ได้พูดแบบนี้เลย', reply: ['x'], risk: 'none' }));
    check('a "heard" the student never wrote is dropped', out.kind === 'reply' && out.heard === undefined);
  }
  {
    const out = await respond(ask(SECRET), fake('```json\n{"heard":"สอบคณิต","reply":["a"],"risk":"none"}\n```'));
    check('JSON wrapped in a code fence is still read', out.kind === 'reply' && out.heard === 'สอบคณิต');
  }
  {
    const ai = fake('not json at all');
    const out = await respond(ask(SECRET), ai);
    check('a malformed answer becomes "not available"', out.kind === 'unavailable');
    check('  after exactly one retry', ai.calls === 2, `calls: ${ai.calls}`);
  }
  {
    const out = await respond(ask(SECRET), fake({ reply: [], risk: 'none' }));
    check('an empty answer becomes "not available"', out.kind === 'unavailable');
  }
  {
    const out = await respond(ask(SECRET), fake({ reply: ['x'], risk: 'urgent' }));
    check('the AI\'s own "urgent" becomes the care screen', out.kind === 'care');
  }
  {
    const out = await respond(ask(SECRET), fake({ reply: ['x'], risk: 'concern' }));
    check('"concern" keeps the answer and adds the gentle nudge', out.kind === 'reply' && out.concern === true);
  }
  {
    const slow = fake(() => new Promise((r) => setTimeout(() => r({ reply: ['late'], risk: 'none' }), 2000)));
    const t0 = Date.now();
    const out = await respond(ask(SECRET), slow, 200);
    check('a slow AI becomes "not available" at the time limit', out.kind === 'unavailable' && Date.now() - t0 < 1000);
    check('  without a second long wait', slow.calls === 1);
  }
  {
    const broken = fake(() => {
      throw new Error(`upstream rejected: ${SECRET}`);
    });
    const out = await respond(ask(SECRET), broken);
    check('an AI that throws becomes "not available"', out.kind === 'unavailable');
  }
  {
    const out = await respond(ask(SECRET), null);
    check('with no AI configured, it says so plainly', out.kind === 'unavailable');
  }

  // ---- the stand-in
  {
    const out = await respond(ask(SECRET), mockProvider);
    check('the development stand-in answers in the contract\'s shape', out.kind === 'reply' && out.lines.length >= 1);
    check('  quoting the student\'s own words', out.kind === 'reply' && !!out.heard && SECRET.includes(out.heard));
    check('  and is marked as a test, never passed off as the AI', out.kind === 'reply' && out.mock === true);
  }
  {
    const env = process.env.NODE_ENV;
    const chosen = process.env.VENT_PROVIDER;
    delete process.env.VENT_PROVIDER;
    process.env.NODE_ENV = 'production';
    check('production never falls back to the stand-in', getProvider() === null);
    process.env.NODE_ENV = env;
    if (chosen !== undefined) process.env.VENT_PROVIDER = chosen;
  }

  // ---- privacy
  check('nothing the student wrote was ever logged', !logged.some((l) => l.includes('สอบคณิต') || l.includes('อ่านไม่จบ')), logged.join(' | '));
  check('  (and failures were logged, by name only)', logged.length > 0);
} finally {
  console.error = realError;
}

console.log(failures ? `\n${failures} FAILED` : '\nall passed');
process.exit(failures ? 1 : 0);
