// End-to-end test of setting up the admin IN THE BROWSER, with no terminal command and no
// configuration. Run:  npm run build  then  npm run test:setup:e2e
//
// It starts its own production server with NO admin settings at all (no ADMIN_*, no
// SESSION_SECRET), on its own port and scratch database (data/e2e-setup.db), and walks the
// whole life of the account: the closed panel, the setup code, the first-time form, a
// password change, a server restart, and "I forgot the password". It never touches a
// server you have running or data/app.db.
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

import { createClient } from '@libsql/client';
import puppeteer from 'puppeteer-core';

const ROOT = path.resolve(import.meta.dirname, '..');
if (!fs.existsSync(path.join(ROOT, '.next', 'BUILD_ID'))) {
  console.error('There is no production build. Run `npm run build` first.');
  process.exit(1);
}

const PORT = 3400 + Math.floor(Math.random() * 90);
const BASE = `http://localhost:${PORT}`;
const DB_FILE = path.join(ROOT, 'data', 'e2e-setup.db');
const CODE_FILE = path.join(ROOT, 'data', 'admin-setup-code-e2e-setup.txt');

const CANDIDATES = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].filter(Boolean);
const executablePath = CANDIDATES.find((p) => fs.existsSync(p));
if (!executablePath) {
  console.error('No Chrome or Edge found. Set CHROME_PATH.');
  process.exit(1);
}

let failures = 0;
const check = (label, ok, detail = '') => {
  if (!ok) failures += 1;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${!ok && detail ? `\n        ${detail}` : ''}`);
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function eventually(fn, ok = Boolean, ms = 8000) {
  const end = Date.now() + ms;
  let last;
  while (Date.now() < end) {
    try {
      last = await fn();
      if (ok(last)) return last;
    } catch {
      /* try again */
    }
    await sleep(150);
  }
  return last;
}

const rm = () => {
  for (const f of [DB_FILE, `${DB_FILE}-journal`, `${DB_FILE}-wal`, `${DB_FILE}-shm`, CODE_FILE]) {
    try {
      fs.rmSync(f, { force: true });
    } catch {
      /* Windows may still hold it a moment */
    }
  }
};
rm();

// No admin settings of any kind: that is the point.
const env = { ...process.env, NODE_ENV: 'production', PORT: String(PORT), DATABASE_URL: `file:${DB_FILE}` };
for (const k of ['ADMIN_USERNAME', 'ADMIN_PASSWORD_HASH', 'SESSION_SECRET']) delete env[k];

let server;
let log = '';
function startServer() {
  server = spawn(process.execPath, [path.join(ROOT, 'node_modules/next/dist/bin/next'), 'start', '-p', String(PORT)], {
    cwd: ROOT,
    env,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  server.stdout.on('data', (d) => (log += d));
  server.stderr.on('data', (d) => (log += d));
}
function stopServer() {
  if (!server || server.exitCode !== null) return;
  if (process.platform === 'win32') spawnSync('taskkill', ['/PID', String(server.pid), '/T', '/F']);
  else server.kill();
}
process.on('exit', stopServer);
async function waitUp() {
  return eventually(async () => (await fetch(`${BASE}/`)).status, (s) => s === 200, 45_000);
}

startServer();
if ((await waitUp()) !== 200) {
  console.error(`The test server did not start.\n${log}`);
  stopServer();
  process.exit(1);
}

const db = createClient({ url: `file:${DB_FILE}` });
const scalar = async (sql, args = []) => Object.values((await db.execute({ sql, args })).rows[0] ?? {})[0];
const setting = (key) => scalar('SELECT value FROM setting WHERE key = ?', [key]);
const api = (p, { method = 'GET', body, cookie, headers = {} } = {}) =>
  fetch(BASE + p, {
    method,
    redirect: 'manual',
    headers: { ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(cookie ? { Cookie: cookie } : {}), ...headers },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
const cookieFrom = (res) => (res.headers.getSetCookie?.() ?? []).map((c) => c.split(';')[0]).join('; ');
const setup = (over = {}, extra = {}) =>
  api('/api/admin/setup', { method: 'POST', body: { username: 'council', password: 'a long enough phrase', ...over }, ...extra });
const PW1 = 'a long enough phrase';
const PW2 = 'a brand new passphrase';

const browser = await puppeteer.launch({ executablePath, headless: true });
const cspErrors = [];
const newPage = async (ctx) => {
  const page = await ctx.newPage();
  await page.setViewport({ width: 1100, height: 900 });
  page.on('console', (m) => /content security policy/i.test(m.text()) && cspErrors.push(m.text()));
  return page;
};
const textOf = (page) => page.evaluate(() => document.body.innerText);

try {
  // ============ 1. nothing is set up: the panel is closed, and points at setup ============
  {
    const a = await api('/admin');
    check('/admin with no account sends you to login', [302, 307, 308].includes(a.status) && (a.headers.get('location') ?? '').includes('/admin/login'));
    const b = await api('/admin/login');
    check('and login sends a first visit on to the one-time setup', [302, 307, 308].includes(b.status) && (b.headers.get('location') ?? '').includes('/admin/setup'), b.headers.get('location'));
    check('the admin API says "not configured" (503), not "unauthorized"', (await api('/api/admin/export?kind=sessions')).status === 503 && (await api('/api/admin/login', { method: 'POST', body: { username: 'a', password: 'b' } })).status === 503);
    const page = await api('/admin/setup');
    check('the setup page opens', page.status === 200);
    check('and is not indexed', /noindex/i.test(page.headers.get('x-robots-tag') ?? ''));
    check('no default account exists: the database has no admin and no password', (await setting('admin_account')) === undefined);
  }

  // ============ 2. the setup code (a live server needs it) ============
  const code = await setting('admin_setup_code');
  {
    check('opening the setup page made a setup code, easy to read out (xxxx-xxxx)', /^[a-z2-9]{4}-[a-z2-9]{4}$/.test(code), String(code));
    await sleep(500);
    check("and printed it in the server's log, for whoever runs the machine", log.includes(`Setup code: ${code}`), log.slice(-200));
    check('and wrote it to a file next to the database', fs.existsSync(CODE_FILE) && fs.readFileSync(CODE_FILE, 'utf8').trim() === code);
    check('the code is not in any page a visitor can load', !(await (await api('/admin/setup')).text()).includes(code));

    check('setup with no code is refused (403)', (await setup()).status === 403);
    await db.execute('DELETE FROM auth_lock'); // that counted as one failed try; start the count fresh
    for (let i = 1; i <= 4; i += 1) check(`a wrong code #${i} is refused (403)`, (await setup({}, { body: { username: 'council', password: PW1, code: 'zzzz-zzzz' } })).status === 403);
    const fifth = await setup({}, { body: { username: 'council', password: PW1, code: 'zzzz-zzzz' } });
    check('the fifth wrong code locks the setup (429)', fifth.status === 429, String(fifth.status));
    check('while locked, even the RIGHT code is refused', (await setup({}, { body: { username: 'council', password: PW1, code } })).status === 429);
    check('and no account was made by any of that', (await setting('admin_account')) === undefined);
    await db.execute('DELETE FROM auth_lock');

    const withCode = (over) => ({ body: { username: 'council', password: PW1, code, ...over } });
    check('the code is read without regard to case (upper case gets past the code check, and is stopped later by the username rule: 400, not 403)', (await setup({}, withCode({ code: code.toUpperCase(), username: 'a b' }))).status === 400);
    check('a weak password is refused (400)', (await setup({}, withCode({ password: 'short' }))).status === 400);
    check('a password containing the username is refused (400)', (await setup({}, withCode({ password: 'my council phrase' }))).status === 400);
    check('a bad username is refused (400)', (await setup({}, withCode({ username: 'a b' }))).status === 400 && (await setup({}, withCode({ username: "x'; drop table setting" }))).status === 400);
    const evil = await setup({}, { ...withCode({}), headers: { Origin: 'http://evil.example' } });
    check("a setup from another website's page is refused (403), even with the right code", evil.status === 403, String(evil.status));
    check('still no account', (await setting('admin_account')) === undefined);
  }

  // ============ 3. the first-time form, in a browser ============
  const ctx = await browser.createBrowserContext();
  const page = await newPage(ctx);
  await page.goto(`${BASE}/admin`, { waitUntil: 'networkidle0' });
  check('opening /admin lands on the setup form', page.url().endsWith('/admin/setup'), page.url());
  check('which asks for the code on a live server', (await page.$('input[name=code]')) !== null);
  await page.type('input[name=username]', 'council');
  await page.type('input[name=password]', PW1);
  await page.type('input[name=again]', 'something different');
  await page.type('input[name=code]', code);
  await page.click('button[type=submit]');
  const mismatch = await eventually(() => page.$eval('[role=alert]', (e) => e.textContent), (t) => t.length > 0);
  check('two different passwords say so, in Thai, and nothing is made', mismatch.includes('ไม่ตรง') && (await setting('admin_account')) === undefined, mismatch);
  await page.$eval('input[name=again]', (e) => (e.value = ''));
  await page.type('input[name=again]', PW1);
  await Promise.all([page.waitForFunction(() => location.pathname === '/admin', { timeout: 20000 }), page.click('button[type=submit]')]);
  await page.waitForSelector('button[role=radio]');
  check('a good form makes the account and signs in straight away', page.url() === `${BASE}/admin`);

  const cookie = (await page.cookies()).find((c) => c.name === 'cud_admin');
  check('with an HttpOnly, SameSite=Lax cookie', !!cookie && cookie.httpOnly && cookie.sameSite === 'Lax');
  const stored = JSON.parse(String(await setting('admin_account')));
  check('the account is stored as a hash, never the password', stored.username === 'council' && stored.hash.startsWith('scrypt.') && !stored.hash.includes('enough'));
  check("the password is not in the server's log", !log.includes(PW1));
  check('the signing secret was made on its own and stored (no configuration)', String(await setting('session_secret')).length >= 32);
  check('the setup code is used up: gone from the database and the file', (await setting('admin_setup_code')) === undefined && !fs.existsSync(CODE_FILE));
  check('the panel shows the account, with a change-password form', (await textOf(page)).includes('เปลี่ยนรหัสผ่าน') && (await page.$('section[aria-labelledby="account-h"] input[name=current]')) !== null);

  // ============ 4. setup is over: it cannot be used again ============
  {
    const again = await api('/admin/setup');
    check('the setup page is gone once an account exists', [302, 307, 308].includes(again.status) && (again.headers.get('location') ?? '').includes('/admin/login'));
    const second = await setup({}, { body: { username: 'intruder', password: 'another long phrase', code: 'aaaa-bbbb' } });
    check('and the setup API refuses (409), so it cannot take over a running panel', second.status === 409, String(second.status));
    check('the account is still the first one', JSON.parse(String(await setting('admin_account'))).username === 'council');
  }

  // ============ 5. changing the password, in the panel ============
  const oldLogin = await api('/api/admin/login', { method: 'POST', body: { username: 'council', password: PW1 } });
  const oldCookie = cookieFrom(oldLogin);
  const card = 'section[aria-labelledby="account-h"]';
  const fill = async (cur, next, again) => {
    for (const [name, v] of [['current', cur], ['next', next], ['again', again]]) await page.$eval(`${card} input[name=${name}]`, (el, val) => { el.value = val; }, v);
    await page.click(`${card} button[type=submit]`);
    return eventually(() => page.$eval(`${card} [role=status]`, (e) => e.textContent), (t) => t.length > 0 && !t.includes('กำลัง'));
  };
  {
    const wrong = await fill('not my password', PW2, PW2);
    check('a wrong current password is refused, and it does not throw you out', wrong.includes('ไม่ถูกต้อง') && page.url() === `${BASE}/admin`, wrong);
    check('a new password typed twice differently is refused', (await fill(PW1, PW2, 'nope nope nope')).includes('ไม่ตรง'));
    check('a weak new password is refused', (await fill(PW1, 'short', 'short')).includes('สั้นเกินไป'));
    check('none of that changed the password', JSON.parse(String(await setting('admin_account'))).hash === stored.hash);

    const done = await fill(PW1, PW2, PW2);
    check('the right current password and a good new one changes it', done.includes('เปลี่ยนรหัสผ่านแล้ว'), done);
    const changed = JSON.parse(String(await setting('admin_account')));
    check('a new hash is stored, for the same username', changed.hash !== stored.hash && changed.username === 'council');
    await page.reload({ waitUntil: 'networkidle0' });
    check('this browser stays signed in (it got a fresh cookie)', page.url() === `${BASE}/admin`);
    check('but a session opened with the OLD password is signed out', [302, 307, 308].includes((await api('/admin', { cookie: oldCookie })).status));
    check('the old password no longer logs in', (await api('/api/admin/login', { method: 'POST', body: { username: 'council', password: PW1 } })).status === 401);
    check('the new one does', (await api('/api/admin/login', { method: 'POST', body: { username: 'council', password: PW2 } })).status === 200);
  }

  // signing out and back in through the form
  {
    await page.evaluate(() => [...document.querySelectorAll('button')].find((b) => b.textContent.trim() === 'ออกจากระบบ').click());
    await page.waitForFunction(() => location.pathname === '/admin/login', { timeout: 10000 });
    await page.type('input[name=username]', 'council');
    await page.type('input[name=password]', PW2);
    await Promise.all([page.waitForFunction(() => location.pathname === '/admin', { timeout: 15000 }), page.click('button[type=submit]')]);
    check('signing out and back in with the new password works', true);
  }

  // ============ 6. a restart must not sign anyone out ============
  {
    const before = (await page.cookies()).find((c) => c.name === 'cud_admin');
    stopServer();
    await sleep(1500);
    startServer();
    check('the server restarts', (await waitUp()) === 200);
    const r = await api('/admin', { cookie: `cud_admin=${before.value}` });
    check('and the browser is still signed in after the restart (the secret is stored, not remade)', r.status === 200, String(r.status));
  }

  // ============ 7. "I forgot the password" ============
  {
    const cookieBefore = (await page.cookies()).find((c) => c.name === 'cud_admin');
    const noAnswer = spawnSync(process.execPath, ['--experimental-strip-types', '--no-warnings', path.join(ROOT, 'scripts/admin-reset.mjs')], { cwd: ROOT, env, input: 'nope\n', encoding: 'utf8' });
    check('the reset command asks first, and does nothing if you do not type RESET', noAnswer.status === 1 && !!(await setting('admin_account')), noAnswer.stdout);
    const reset = spawnSync(process.execPath, ['--experimental-strip-types', '--no-warnings', path.join(ROOT, 'scripts/admin-reset.mjs'), '--yes'], { cwd: ROOT, env, encoding: 'utf8' });
    check('with --yes it removes the account', reset.status === 0 && (await setting('admin_account')) === undefined, reset.stdout + reset.stderr);
    check('the old sign-in stops working at once', [302, 307, 308].includes((await api('/admin', { cookie: `cud_admin=${cookieBefore.value}` })).status));
    const b = await api('/admin/login');
    check('the setup page is back', [302, 307, 308].includes(b.status) && (b.headers.get('location') ?? '').includes('/admin/setup'));
    await api('/admin/setup');
    const code2 = await setting('admin_setup_code');
    check('with a NEW setup code, printed in the log again', /^[a-z2-9]{4}-[a-z2-9]{4}$/.test(code2) && code2 !== code && (await eventually(() => log.includes(`Setup code: ${code2}`))), String(code2));
    const second = await setup({ username: 'second.admin', password: 'yet another phrase!' }, { body: { username: 'second.admin', password: 'yet another phrase!', code: code2 } });
    check('a new admin can be set up with it', second.status === 200 && JSON.parse(String(await setting('admin_account'))).username === 'second.admin', String(second.status));
  }

  check('through all of this the browser reported no content-security-policy violation', cspErrors.length === 0, cspErrors.slice(0, 2).join(' | '));
} finally {
  await browser.close();
  db.close();
  stopServer();
  await sleep(500);
  rm();
}

console.log(failures ? `\n${failures} FAILED` : '\nall passed');
process.exit(failures ? 1 : 0);
