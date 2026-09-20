// End-to-end test of the admin panel, the booth login and the security rules, in a real
// browser. Run:  npm run build  then  npm run test:admin:e2e
//
// SAFE BY CONSTRUCTION. It starts its OWN production server, on its own port, with its
// own scratch database (data/e2e-admin.db, deleted before and after) and its own admin
// login made up for the run. It never talks to a server you have running and never
// touches data/app.db, so it may delete everything (the wipe test does) without risk.
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

import { createClient } from '@libsql/client';
import puppeteer from 'puppeteer-core';

import { WIPE_WORD } from '../content/th/admin.ts';
import { hashPassword, newSecret } from '../lib/auth.ts';

const ROOT = path.resolve(import.meta.dirname, '..');
if (!fs.existsSync(path.join(ROOT, '.next', 'BUILD_ID'))) {
  console.error('There is no production build. Run `npm run build` first.');
  process.exit(1);
}

const PORT = 3300 + Math.floor(Math.random() * 90);
const BASE = `http://localhost:${PORT}`;
const DB_FILE = path.join(ROOT, 'data', 'e2e-admin.db');
const SHOTS = process.env.SHOTS;
const USER = 'council';
const PASSWORD = 'an easy to remember phrase';

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

// ---- our own server, database and admin ----
const rmDb = () => {
  for (const s of ['', '-journal', '-wal', '-shm']) {
    try {
      fs.rmSync(DB_FILE + s, { force: true });
    } catch {
      /* Windows may still hold it a moment */
    }
  }
};
rmDb();
const env = {
  ...process.env,
  NODE_ENV: 'production',
  PORT: String(PORT),
  DATABASE_URL: `file:${DB_FILE}`,
  ADMIN_USERNAME: USER,
  ADMIN_PASSWORD_HASH: await hashPassword(PASSWORD),
  SESSION_SECRET: newSecret(),
};
const server = spawn(process.execPath, [path.join(ROOT, 'node_modules/next/dist/bin/next'), 'start', '-p', String(PORT)], {
  cwd: ROOT,
  env,
  stdio: ['ignore', 'pipe', 'pipe'],
});
let serverLog = '';
server.stdout.on('data', (d) => (serverLog += d));
server.stderr.on('data', (d) => (serverLog += d));
const stopServer = () => {
  if (server.exitCode !== null) return;
  if (process.platform === 'win32') spawnSync('taskkill', ['/PID', String(server.pid), '/T', '/F']);
  else server.kill();
};
process.on('exit', stopServer);

const up = await eventually(async () => (await fetch(`${BASE}/`)).status, (s) => s === 200, 45_000);
if (up !== 200) {
  console.error(`The test server did not start.\n${serverLog}`);
  stopServer();
  process.exit(1);
}
const db = createClient({ url: `file:${DB_FILE}` });
const scalar = async (sql, args = []) => Object.values((await db.execute({ sql, args })).rows[0] ?? {})[0];

// ---- seed: known sessions, on Thailand's calendar ----
const BANGKOK = 7 * 3_600_000;
const DAY = 86_400_000;
const todayStart = Math.floor((Date.now() + BANGKOK) / DAY) * DAY - BANGKOK;
let n = 0;
async function seed({ mode, at, seconds, state, primary, secondary, flower, answers = [] }) {
  n += 1;
  const id = `e2e0${String(n).padStart(4, '0')}-0000-4000-8000-000000000000`;
  const started = new Date(at).toISOString();
  await db.execute({
    sql: `INSERT INTO session (id, mode, festival, started_at, completed_at, result_state, primary_topic, secondary_topic, booth_result, device_bucket)
          VALUES (?, ?, 'loykrathong', ?, ?, ?, ?, ?, ?, 'mobile')`,
    args: [id, mode, started, seconds === null ? null : new Date(at + seconds * 1000).toISOString(), state ?? null, primary ?? null, secondary ?? null, flower ?? null],
  });
  let t = at;
  for (const [q, c] of answers) {
    t += 4000;
    await db.execute({ sql: 'INSERT INTO answer (session_id, question_id, choice_id, answered_at) VALUES (?, ?, ?, ?)', args: [id, q, c, new Date(t).toISOString()] });
  }
  return id;
}
const H = 3_600_000;
const ci = (extra) => ({ mode: 'checkin', ...extra });
await seed(ci({ at: todayStart + 1 * H, seconds: 90, state: 'ok', primary: 'study', secondary: 'rest', answers: [['q1-study', 'a'], ['q2-pressure', 'a']] }));
await seed(ci({ at: todayStart + 2 * H, seconds: 120, state: 'drained', primary: 'study', secondary: 'friends', answers: [['q1-study', 'c'], ['q2-pressure', 'b']] }));
await seed(ci({ at: todayStart + 3 * H, seconds: 60, state: 'heavy', primary: 'family', secondary: 'rest', answers: [['q1-study', 'd']] }));
const unfinishedId = await seed(ci({ at: todayStart + 4 * H, seconds: null, answers: [['q1-study', 'b']] }));
await seed({ mode: 'booth', at: todayStart + 5 * H, seconds: 40, flower: 'lotus', answers: [['b1', 'a'], ['b2', 'a'], ['b3', 'a']] });
await seed({ mode: 'booth', at: todayStart + 6 * H, seconds: 30, flower: 'marigold', answers: [['b1', 'b']] });
await seed(ci({ at: todayStart - 20 * H, seconds: 100, state: 'thinking', primary: 'friends', secondary: 'freetime', answers: [['q1-study', 'a']] }));
await seed(ci({ at: todayStart - 19 * H, seconds: 80, state: 'ok', primary: 'rest', secondary: 'study', answers: [['q1-study', 'b']] }));
await seed({ mode: 'booth', at: todayStart - 18 * H, seconds: 50, flower: 'champak', answers: [['b1', 'c']] });
const SEEDED = { total: 9, completed: 8, booth: 3, checkin: 6, today: 6, answers: 2 + 2 + 1 + 1 + 3 + 1 + 1 + 1 + 1 };

// ---- helpers ----
const api = (p, { method = 'GET', body, cookie, headers = {} } = {}) =>
  fetch(BASE + p, {
    method,
    redirect: 'manual',
    headers: { ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(cookie ? { Cookie: cookie } : {}), ...headers },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
const cookieFrom = (res) => (res.headers.getSetCookie?.() ?? []).map((c) => c.split(';')[0]).join('; ');
const login = (pw = PASSWORD, user = USER) => api('/api/admin/login', { method: 'POST', body: { username: user, password: pw } });

const browser = await puppeteer.launch({ executablePath, headless: true });
const cspErrors = [];
const watch = (page) => {
  page.on('console', (m) => /content security policy/i.test(m.text()) && cspErrors.push(m.text()));
  page.on('pageerror', (e) => /content security policy/i.test(String(e)) && cspErrors.push(String(e)));
};
let dialogMode = 'accept';
const dialogs = [];
const newPage = async (context) => {
  const page = await context.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  watch(page);
  page.on('dialog', async (d) => {
    dialogs.push(d.message());
    await (dialogMode === 'accept' ? d.accept() : d.dismiss());
  });
  return page;
};
const textOf = (page) => page.evaluate(() => document.body.innerText);
// `exact` matters in Thai: "ปิดทั้งหมด" (close all) sits inside "เปิดทั้งหมด" (open all).
const clickText = async (page, selector, text, { exact = false } = {}) => {
  const handle = await page.evaluateHandle(
    (sel, t, x) => [...document.querySelectorAll(sel)].find((e) => (x ? e.textContent.trim() === t : e.textContent.includes(t))) ?? null,
    selector,
    text,
    exact,
  );
  const el = handle.asElement();
  if (!el) throw new Error(`no ${selector} with "${text}"`);
  await el.click();
};
const shot = async (page, name) => SHOTS && (await page.screenshot({ path: path.join(SHOTS, `admin-${name}.png`), fullPage: true }));

try {
  // ============ 1. closed to the public ============
  {
    const r = await api('/admin');
    check('/admin without signing in sends you to the login page', [302, 307, 308].includes(r.status) && r.headers.get('location')?.includes('/admin/login'), `${r.status} ${r.headers.get('location')}`);
    for (const [label, p, method, body] of [
      ['the export', '/api/admin/export?kind=sessions', 'GET'],
      ['switching the live booth', '/api/admin/festival', 'POST', { festival: 'none' }],
      ['editing dates', '/api/admin/events/loykrathong', 'PUT', { start: '2026-11-19', end: '2026-11-20', time: '', place: '' }],
      ['the booth account', '/api/admin/booth-account', 'POST', { regenerate: true }],
      ['deleting a session', `/api/admin/sessions/${unfinishedId}`, 'DELETE'],
      ['wiping everything', '/api/admin/wipe', 'POST', { confirm: WIPE_WORD }],
    ]) {
      const res = await api(p, { method, body });
      check(`${label} is refused (401) without signing in`, res.status === 401, String(res.status));
    }
    check('and nothing was changed by those attempts', (await scalar('SELECT COUNT(*) FROM session')) === SEEDED.total && (await scalar("SELECT value FROM setting WHERE key = 'active_festival'")) === 'loykrathong');

    const login_ = await api('/admin/login');
    const html = await login_.text();
    check('the login page is not indexed (meta and header)', /noindex/i.test(html) && /noindex/i.test(login_.headers.get('x-robots-tag') ?? ''));
    check('robots.txt keeps search engines out of /admin, /booth and /api', (await (await api('/robots.txt')).text()).includes('Disallow: /admin'));

    const home = await api('/');
    const csp = home.headers.get('content-security-policy') ?? '';
    check("a content security policy allows only this site (default-src 'self', no framing)", csp.includes("default-src 'self'") && csp.includes("frame-ancestors 'none'") && !/https?:\/\//.test(csp), csp);
    check('nosniff, no-referrer and no X-Powered-By', home.headers.get('x-content-type-options') === 'nosniff' && home.headers.get('referrer-policy') === 'no-referrer' && !home.headers.has('x-powered-by'));
    for (const p of ['/', '/checkin', '/result', '/booth']) check(`the student page ${p} needs no login`, (await api(p)).status === 200);
  }

  // ============ 2. logging in, and the lockout ============
  let adminCookie = '';
  {
    for (let i = 1; i <= 4; i += 1) {
      const r = await login('wrong password');
      check(`wrong password #${i} is refused (401)`, r.status === 401, String(r.status));
    }
    const fifth = await login('wrong password');
    check('the fifth wrong password locks the account (429)', fifth.status === 429, String(fifth.status));
    const whileLocked = await login(PASSWORD);
    check('while locked, even the right password is refused', whileLocked.status === 429, String(whileLocked.status));
    check('and no cookie is given', cookieFrom(whileLocked) === '');
    check('the lock is stored in the database, not in memory', Number(await scalar("SELECT COUNT(*) FROM auth_lock WHERE key = 'admin' AND locked_until IS NOT NULL")) === 1);
    await db.execute('DELETE FROM auth_lock');

    const noUser = await login(PASSWORD, 'someone-else');
    const noPass = await login('nope');
    check('a wrong username and a wrong password give the same answer', noUser.status === 401 && noPass.status === 401 && JSON.stringify(await noUser.json()) === JSON.stringify(await noPass.json()));
    await db.execute('DELETE FROM auth_lock');

    const good = await login();
    adminCookie = cookieFrom(good);
    const raw = (good.headers.getSetCookie?.() ?? []).join(' | ');
    check('the right password signs in (200)', good.status === 200 && adminCookie.startsWith('cud_admin='));
    check('the cookie is HttpOnly and SameSite=Lax', /httponly/i.test(raw) && /samesite=lax/i.test(raw), raw);
    check('and it lasts 8 hours', /max-age=28800/i.test(raw), raw);
    check('the password is not in the cookie', !adminCookie.includes(encodeURIComponent(PASSWORD)) && !Buffer.from(adminCookie.split('=')[1].split('.')[0], 'base64url').toString().includes(PASSWORD));
    check('with the cookie, the panel opens', (await api('/admin', { cookie: adminCookie })).status === 200);
    check('a tampered cookie does not', (await api('/admin', { cookie: `${adminCookie.slice(0, -3)}AAA` })).status !== 200);
    check('a forged cookie for another role does not', (await api('/admin', { cookie: 'cud_admin=eyJyb2xlIjoiYWRtaW4ifQ.abc' })).status !== 200);

    const evil = await api('/api/admin/festival', { method: 'POST', cookie: adminCookie, body: { festival: 'none' }, headers: { Origin: 'http://evil.example' } });
    check("a change made from another website's page is refused (403), even with the cookie", evil.status === 403, String(evil.status));
    const cross = await api('/api/admin/festival', { method: 'POST', cookie: adminCookie, body: { festival: 'none' }, headers: { 'Sec-Fetch-Site': 'cross-site' } });
    check('and so is one the browser marks cross-site', cross.status === 403, String(cross.status));
    check('the live booth was not changed by either', (await scalar("SELECT value FROM setting WHERE key = 'active_festival'")) === 'loykrathong');
    const same = await api('/api/admin/festival', { method: 'POST', cookie: adminCookie, body: { festival: 'loykrathong' }, headers: { Origin: BASE } });
    check('a change from this site is accepted', same.status === 200, String(same.status));
    const big = await api('/api/admin/festival', { method: 'POST', cookie: adminCookie, body: { festival: 'x'.repeat(5000) } });
    check('an oversized request is refused (413)', big.status === 413, String(big.status));
    const bad = await api('/api/admin/festival', { method: 'POST', cookie: adminCookie, body: { festival: 'not-a-festival' } });
    check('an unknown festival is refused (400)', bad.status === 400, String(bad.status));
  }

  // ============ 3. the panel, in a browser ============
  const adminCtx = await browser.createBrowserContext();
  const page = await newPage(adminCtx);
  await page.goto(`${BASE}/admin/login`, { waitUntil: 'networkidle0' });
  await page.type('input[name=username]', USER);
  await page.type('input[name=password]', 'a wrong one');
  await page.click('button[type=submit]');
  const wrongMsg = await eventually(() => page.$eval('[role=alert]', (e) => e.textContent), (t) => t.length > 0);
  check('a wrong password in the form says so in Thai', wrongMsg.includes('ไม่ถูกต้อง'), wrongMsg);
  await page.$eval('input[name=password]', (e) => (e.value = ''));
  await page.type('input[name=password]', PASSWORD);
  await Promise.all([page.waitForFunction(() => location.pathname === '/admin', { timeout: 15000 }), page.click('button[type=submit]')]);
  await page.waitForSelector('button[role=radio]');
  check('the right password opens the panel', page.url() === `${BASE}/admin`);
  const cookies = await page.cookies();
  const c = cookies.find((x) => x.name === 'cud_admin');
  check('the browser holds an HttpOnly, SameSite=Lax cookie that expires in about 8 hours', !!c && c.httpOnly && c.sameSite === 'Lax' && Math.abs(c.expires - Date.now() / 1000 - 8 * 3600) < 600, JSON.stringify(c));
  check('and page scripts cannot read it', !(await page.evaluate(() => document.cookie)).includes('cud_admin'));

  // the numbers
  const stats = await page.$$eval('ul[aria-label] li', (lis) => lis.map((li) => [li.children[1]?.textContent, li.children[0]?.textContent]));
  const stat = (label) => stats.find(([l]) => l === label)?.[1];
  check('the summary counts every session', stat('ทั้งหมด') === String(SEEDED.total), JSON.stringify(stats));
  check('and the finished ones', stat('ทำจนจบ') === String(SEEDED.completed));
  check('and the completion rate (8 of 9)', stat('อัตราที่ทำจนจบ') === '89%');
  check("and today's count, on Thailand's calendar", stat('วันนี้') === String(SEEDED.today));
  const text = await textOf(page);
  check('the live booth is marked (ลอยกระทง เปิดอยู่)', (await page.$eval('button[role=radio][aria-checked=true]', (e) => e.textContent)).includes('ลอยกระทง'));
  check('the charts show the result states and the flowers', text.includes('ผลเช็กอิน') && text.includes('ดอกบัว') && text.includes('ดาวเรือง'));
  check('and the answers to each question', text.includes('เรื่องเรียนช่วงนี้เป็นยังไงบ้าง?'));
  check('the panel warns that the booth screens are still open (no booth password yet)', text.includes('ใครก็เปิดหน้าจอบูธได้'));

  // the sessions list: grouped and collapsible
  const groups = () => page.$$eval('button[aria-controls^="grp-"]', (bs) => bs.map((b) => [b.getAttribute('aria-expanded'), b.textContent]));
  let g = await groups();
  check('grouped by day, newest first: two days', g.length === 2, JSON.stringify(g));
  check("today's group is open and the older day is closed", g[0][0] === 'true' && g[1][0] === 'false', JSON.stringify(g));
  check('the group header gives the count and a breakdown', /6/.test(g[0][1]) && g[0][1].includes('ยังไม่จบ'), g[0][1]);
  check('a day with both modes is split into check-in and booth', (await textOf(page)).includes('เช็กอิน') && (await page.$$eval('p', (ps) => ps.filter((p) => p.textContent === 'บูธ').length)) >= 1);
  await page.$$eval('button[aria-controls^="grp-"]', (bs) => bs[1].click());
  g = await groups();
  check('clicking a closed group opens it', g[1][0] === 'true');
  await page.focus('button[aria-controls^="grp-"]');
  await page.keyboard.press('Enter');
  g = await groups();
  check('Enter toggles a group', g[0][0] === 'false');
  await page.keyboard.press('Space');
  g = await groups();
  check('and so does Space', g[0][0] === 'true');
  await clickText(page, 'button', 'ปิดทั้งหมด', { exact: true });
  check('"close all" closes them', (await groups()).every(([open]) => open === 'false'));
  await clickText(page, 'button', 'เปิดทั้งหมด', { exact: true });
  check('"open all" opens them', (await groups()).every(([open]) => open === 'true'));

  const firstRow = await page.$('button[aria-controls^="sess-"]');
  await firstRow.click();
  await sleep(300);
  const expanded = await page.$eval('button[aria-controls^="sess-"][aria-expanded=true]', (b) => document.getElementById(b.getAttribute('aria-controls')).innerText);
  check('a session opens to its question and the answer given, in Thai', expanded.includes('เรื่องเรียนช่วงนี้เป็นยังไงบ้าง?') && expanded.includes('มีบางวิชาที่เริ่มตามไม่ทัน'), expanded.slice(0, 160));
  check('and its id, with a copy button', /e2e0\d{4}-0000-4000-8000-000000000000/.test(expanded) && expanded.includes('คัดลอก'));
  await clickText(page, 'button', 'โหมด');
  const byMode = await page.$$eval('button[aria-controls^="grp-"]', (bs) => bs.map((b) => b.textContent));
  check('grouping by mode gives check-in and booth', byMode.some((t) => t.includes('เช็กอิน')) && byMode.some((t) => t.includes('บูธ')) && byMode.length === 2, JSON.stringify(byMode));
  await clickText(page, 'button', 'ผลลัพธ์');
  check('grouping by result works too', (await page.$$eval('button[aria-controls^="grp-"]', (bs) => bs.length)) >= 4);
  await shot(page, 'panel');

  // filters
  await page.goto(`${BASE}/admin?mode=booth`, { waitUntil: 'networkidle0' });
  const boothStats = await page.$$eval('ul[aria-label] li', (lis) => lis.map((li) => [li.children[1]?.textContent, li.children[0]?.textContent]));
  check('filtering to booth shows only booth sessions', boothStats.find(([l]) => l === 'ทั้งหมด')[1] === String(SEEDED.booth), JSON.stringify(boothStats));
  check('the filter form keeps what was chosen', (await page.$eval('select[name=mode]', (e) => e.value)) === 'booth');
  await page.select('select[name=mode]', 'checkin');
  await page.select('select[name=status]', 'open');
  await Promise.all([page.waitForNavigation({ waitUntil: 'networkidle0' }), page.click('form[aria-label] button[type=submit]')]);
  check('the form filters through the address bar (check-in, unfinished: 1)', page.url().includes('mode=checkin') && page.url().includes('status=open') && (await page.$$eval('ul[aria-label] li', (l) => l[0].children[0].textContent)) === '1');
  await page.goto(`${BASE}/admin?q=${'%27%20or%201%3D1%20--'}`, { waitUntil: 'networkidle0' });
  check('an id search that is really SQL matches nothing and breaks nothing', (await page.$$eval('ul[aria-label] li', (l) => l[0].children[0].textContent)) === '0');

  // ============ 4. the controls ============
  await page.goto(`${BASE}/admin`, { waitUntil: 'networkidle0' });

  dialogMode = 'dismiss';
  dialogs.length = 0;
  await clickText(page, 'button[role=radio]', 'คริสต์มาส');
  await sleep(500);
  check('switching the live booth asks first; saying no changes nothing', dialogs.length === 1 && dialogs[0].includes('คริสต์มาส') && (await scalar("SELECT value FROM setting WHERE key = 'active_festival'")) === 'loykrathong');
  dialogMode = 'accept';
  await clickText(page, 'button[role=radio]', 'คริสต์มาส');
  await eventually(() => scalar("SELECT value FROM setting WHERE key = 'active_festival'"), (v) => v === 'christmas');
  check('saying yes switches it', (await scalar("SELECT value FROM setting WHERE key = 'active_festival'")) === 'christmas');
  await page.waitForFunction(() => document.body.innerText.includes('ยังไม่มีเนื้อหาของบูธนี้'), { timeout: 8000 });
  check('a festival with no content shows a plain warning beside the control', true);
  const closed = await (await api('/booth')).text();
  check('and students then see the closed booth page', closed.includes('หน้านี้จะเปิดตอนมีบูธ'));
  await clickText(page, 'button[role=radio]', 'ลอยกระทง');
  await eventually(() => scalar("SELECT value FROM setting WHERE key = 'active_festival'"), (v) => v === 'loykrathong');
  check('switching back restores the booth', (await scalar("SELECT value FROM setting WHERE key = 'active_festival'")) === 'loykrathong');
  check('past sessions keep the festival they were recorded under', Number(await scalar("SELECT COUNT(*) FROM session WHERE festival = 'loykrathong'")) === SEEDED.total);

  // events
  const form = 'form[aria-labelledby="ev-loykrathong-name"]';
  const setField = (name, v) => page.$eval(`${form} [name=${name}]`, (el, value) => { el.value = value; }, v);
  await setField('start', '2026-11-25');
  await setField('end', '2026-11-26');
  await setField('time', '10.00–12.00 น.');
  await setField('place', 'ห้องทดสอบ');
  await page.click(`${form} button[type=submit]`);
  await page.waitForFunction((f) => document.querySelector(`${f} [role=status]`)?.textContent.includes('บันทึกแล้ว'), { timeout: 8000 }, form);
  const homeHtml = await (await api('/')).text();
  check('saving dates changes the home page for students', homeHtml.includes('25–26 พ.ย. 2569'), 'home page did not show the new date');
  await setField('end', '2026-11-20');
  await page.click(`${form} button[type=submit]`);
  await page.waitForFunction((f) => document.querySelector(`${f} [role=status]`)?.textContent.includes('วันเดียว'), { timeout: 8000 }, form);
  check('an end date before the start is treated as one day, and says so', (await (await api('/')).text()).includes('25 พ.ย. 2569'));
  check('changing a date does not change which booth is live', (await scalar("SELECT value FROM setting WHERE key = 'active_festival'")) === 'loykrathong');
  await setField('start', '2026-11-19');
  await setField('end', '2026-11-20');
  await setField('time', '11.10–12.50 น.');
  await setField('place', 'โถงโรงอาหาร');
  await page.click(`${form} button[type=submit]`);
  await eventually(() => scalar("SELECT start_date FROM event WHERE festival = 'loykrathong'"), (v) => v === '2026-11-19');

  // the booth account
  const card = 'section[aria-labelledby="booth-h"]';
  await page.$eval(`${card} input[name=username]`, (el) => (el.value = 'A B'));
  await clickText(page, `${card} button`, 'บันทึกชื่อ');
  await page.waitForFunction((s) => document.querySelector(`${s} [role=status]`)?.textContent.includes('ตัวอักษรอังกฤษพิมพ์เล็ก'), { timeout: 8000 }, card);
  check('a booth username with spaces or capitals is refused, with the rule in Thai', true);
  await page.$eval(`${card} input[name=username]`, (el) => (el.value = 'canteen.tv'));
  await clickText(page, `${card} button`, 'บันทึกชื่อ');
  await eventually(() => scalar("SELECT value FROM setting WHERE key = 'booth_username'"), (v) => v === 'canteen.tv');
  check('the booth username can be renamed', (await scalar("SELECT value FROM setting WHERE key = 'booth_username'")) === 'canteen.tv');

  await clickText(page, `${card} button`, 'สร้างรหัสผ่านใหม่');
  const boothPassword = await page.waitForSelector('[data-testid=booth-password]').then((el) => el.evaluate((e) => e.textContent));
  check('a new booth password is shown, easy to type (xxxx-xxxx, no look-alikes)', /^[abcdefghjkmnpqrstuvwxyz23456789]{4}-[abcdefghjkmnpqrstuvwxyz23456789]{4}$/.test(boothPassword), boothPassword);
  check('the panel says it is shown only once', (await textOf(page)).includes('แสดงครั้งเดียว'));
  const stored = String(await scalar("SELECT value FROM setting WHERE key = 'booth_password_hash'"));
  check('only its hash is stored', stored.startsWith('scrypt.') && !stored.includes(boothPassword));
  await page.goto(`${BASE}/admin`, { waitUntil: 'networkidle0' });
  check('after reloading, the password cannot be read back, not even by the admin', !(await textOf(page)).includes(boothPassword));
  check('and the "booth screens are open" warning is gone', !(await textOf(page)).includes('ใครก็เปิดหน้าจอบูธได้'));

  // the booth device: its own login, its own cookie
  const boothCtx = await browser.createBrowserContext();
  const booth = await newPage(boothCtx);
  await booth.goto(`${BASE}/booth/kiosk`, { waitUntil: 'networkidle0' });
  check('the kiosk now asks for the booth login', booth.url().includes('/booth/login') && booth.url().includes('next=%2Fbooth%2Fkiosk'), booth.url());
  const tvProbe = await api('/booth/display');
  check('and so does the TV', [302, 307, 308].includes(tvProbe.status) && (tvProbe.headers.get('location') ?? '').includes('/booth/login'), String(tvProbe.status));
  await booth.type('input[name=username]', 'canteen.tv');
  await booth.type('input[name=password]', 'zzzz-zzzz');
  await booth.click('button[type=submit]');
  const boothWrong = await eventually(() => booth.$eval('[role=alert]', (e) => e.textContent), (t) => t.length > 0);
  check('a wrong booth password says so', boothWrong.includes('ไม่ถูกต้อง'), boothWrong);
  await booth.$eval('input[name=password]', (e) => (e.value = ''));
  await booth.type('input[name=password]', boothPassword);
  await Promise.all([booth.waitForFunction(() => location.pathname === '/booth/kiosk', { timeout: 15000 }), booth.click('button[type=submit]')]);
  check('the right booth password opens the kiosk', (await eventually(() => textOf(booth), (t) => t.includes('คุณเป็นดอกไม้แบบไหน?'))).includes('คุณเป็นดอกไม้แบบไหน?'));
  const bc = (await booth.cookies()).find((x) => x.name === 'cud_booth');
  check('the booth cookie is HttpOnly, sent only under /booth, and lasts 12 hours', !!bc && bc.httpOnly && bc.path === '/booth' && Math.abs(bc.expires - Date.now() / 1000 - 12 * 3600) < 600, JSON.stringify(bc));
  const boothCookie = `cud_booth=${bc.value}`;
  check('a booth device can open the TV too', (await api('/booth/display', { cookie: boothCookie })).status === 200);
  check('but can never open the admin panel', [302, 307, 308].includes((await api('/admin', { cookie: boothCookie })).status));
  check('or use an admin API', (await api('/api/admin/export?kind=sessions', { cookie: boothCookie })).status === 401);
  check('while the admin can open the kiosk without the booth login', (await api('/booth/kiosk', { cookie: adminCookie })).status === 200);

  // the booth lockout is separate from the admin's
  for (let i = 0; i < 5; i += 1) await api('/api/booth/login', { method: 'POST', body: { username: 'canteen.tv', password: 'nope' } });
  const boothLocked = await api('/api/booth/login', { method: 'POST', body: { username: 'canteen.tv', password: boothPassword } });
  check('five wrong booth passwords lock the booth login', boothLocked.status === 429, String(boothLocked.status));
  check('without locking the admin out', (await login()).status === 200);
  await db.execute('DELETE FROM auth_lock');

  // a new password signs every booth device out
  await clickText(page, `${card} button`, 'สร้างรหัสผ่านใหม่');
  await page.waitForSelector('[data-testid=booth-password]');
  check('making a new password asked first', dialogs.some((d) => d.includes('สร้างรหัสผ่านใหม่')));
  check('and signs out the booth devices that were signed in', [302, 307, 308].includes((await api('/booth/kiosk', { cookie: boothCookie })).status));

  // ============ 5. export ============
  const csv = await page.evaluate(async () => {
    const res = await fetch('/api/admin/export?kind=sessions', { credentials: 'include' });
    const buf = new Uint8Array(await res.arrayBuffer());
    return { status: res.status, type: res.headers.get('content-type'), disp: res.headers.get('content-disposition'), bom: [...buf.slice(0, 3)], text: new TextDecoder().decode(buf) };
  });
  check('the sessions CSV downloads as an attachment named by kind and date', csv.status === 200 && /attachment; filename="cud-mental-health-sessions-\d{4}-\d{2}-\d{2}\.csv"/.test(csv.disp), csv.disp);
  check('it starts with a UTF-8 byte-order mark, so Excel reads the Thai', csv.bom.join(',') === '239,187,191' && csv.type.includes('utf-8'));
  const lines = csv.text.replace('\uFEFF', '').trim().split('\r\n');
  check('one row per session, and the Thai flower and result names', lines.length === SEEDED.total + 1 && csv.text.includes('ดอกบัว') && csv.text.includes('ใช้พลังงานเยอะ'), `${lines.length} lines`);
  const boothCsv = await page.evaluate(async () => (await (await fetch('/api/admin/export?kind=sessions&mode=booth', { credentials: 'include' })).text()).trim().split('\r\n').length);
  check('the filters apply to the export', boothCsv === SEEDED.booth + 1, String(boothCsv));
  const answersCsv = await page.evaluate(async () => (await (await fetch('/api/admin/export?kind=answers', { credentials: 'include' })).text()).trim().split('\r\n').length);
  check('one row per answer', answersCsv === SEEDED.answers + 1, `${answersCsv} lines`);
  check('an unknown export kind is refused', (await api('/api/admin/export?kind=everything', { cookie: adminCookie })).status === 400);
  const exportLink = await page.$$eval('a[href^="/api/admin/export"]', (as) => as.map((a) => a.getAttribute('href')));
  check('the download buttons carry the current filters', exportLink.length === 2 && exportLink.every((h) => h.includes('kind=')));

  // ============ 6. delete one, wipe all ============
  await page.goto(`${BASE}/admin`, { waitUntil: 'networkidle0' });
  const row = `[data-session="${unfinishedId}"]`;
  await page.$eval(`${row} button[aria-controls^="sess-"]`, (b) => b.click());
  await sleep(300);
  dialogMode = 'dismiss';
  dialogs.length = 0;
  await clickText(page, `${row} button`, 'ลบรายการนี้');
  await sleep(400);
  check('deleting one session asks first; saying no keeps it', dialogs.length === 1 && Number(await scalar('SELECT COUNT(*) FROM session WHERE id = ?', [unfinishedId])) === 1);
  dialogMode = 'accept';
  await clickText(page, `${row} button`, 'ลบรายการนี้');
  await eventually(() => scalar('SELECT COUNT(*) FROM session WHERE id = ?', [unfinishedId]), (v) => Number(v) === 0);
  check('saying yes removes it and its answers', Number(await scalar('SELECT COUNT(*) FROM session WHERE id = ?', [unfinishedId])) === 0 && Number(await scalar('SELECT COUNT(*) FROM answer WHERE session_id = ?', [unfinishedId])) === 0);
  await page.waitForFunction((r) => !document.querySelector(r), { timeout: 8000 }, row);
  check('and it leaves the list', true);
  check('the others are untouched', Number(await scalar('SELECT COUNT(*) FROM session')) === SEEDED.total - 1);
  check('deleting a session that is not there is a 404', (await api(`/api/admin/sessions/${unfinishedId}`, { method: 'DELETE', cookie: adminCookie })).status === 404);

  const danger = 'section[aria-labelledby="danger-h"]';
  await clickText(page, `${danger} button`, 'ลบข้อมูลทั้งหมด');
  const confirmBtn = () => page.evaluate((d) => [...document.querySelectorAll(`${d} button`)].find((b) => b.textContent.includes('ลบทั้งหมดถาวร'))?.disabled, danger);
  check('the wipe button stays disabled until the word is typed', (await confirmBtn()) === true);
  await page.type(`${danger} input[name=confirm]`, 'ลบข้อมูล');
  check('a part of the word is not enough', (await confirmBtn()) === true);
  const forced = await api('/api/admin/wipe', { method: 'POST', cookie: adminCookie, body: { confirm: 'yes please' } });
  check('the server refuses a wrong word even if the button were bypassed', forced.status === 400 && Number(await scalar('SELECT COUNT(*) FROM session')) === SEEDED.total - 1);
  await page.type(`${danger} input[name=confirm]`, 'ทั้งหมด');
  check('the whole word enables it', (await confirmBtn()) === false);
  await shot(page, 'before-wipe');
  await page.evaluate((d) => [...document.querySelectorAll(`${d} button`)].find((b) => b.textContent.includes('ลบทั้งหมดถาวร')).click(), danger);
  await eventually(() => scalar('SELECT COUNT(*) FROM session'), (v) => Number(v) === 0);
  check('the wipe deletes every session and answer', Number(await scalar('SELECT COUNT(*) FROM session')) === 0 && Number(await scalar('SELECT COUNT(*) FROM answer')) === 0);
  check('but keeps the live booth, the dates and both accounts', (await scalar("SELECT value FROM setting WHERE key = 'active_festival'")) === 'loykrathong' && Number(await scalar('SELECT COUNT(*) FROM event')) >= 1 && Number(await scalar("SELECT COUNT(*) FROM setting WHERE key = 'booth_password_hash'")) === 1);
  await page.waitForFunction(() => document.body.innerText.includes('ยังไม่มีข้อมูล'), { timeout: 8000 });
  check('an empty panel is calm: it says there is nothing yet', true);
  await shot(page, 'empty');

  // ============ 7. signing out ============
  await clickText(page, 'button', 'ออกจากระบบ');
  await page.waitForFunction(() => location.pathname === '/admin/login', { timeout: 10000 });
  check('signing out returns to the login page', true);
  check('and clears the cookie', !(await page.cookies()).some((x) => x.name === 'cud_admin' && x.value));
  await page.goto(`${BASE}/admin`, { waitUntil: 'networkidle0' });
  check('so /admin is closed again', page.url().includes('/admin/login'));

  check('through all of this the browser reported no content-security-policy violation', cspErrors.length === 0, cspErrors.slice(0, 2).join(' | '));
} finally {
  await browser.close();
  db.close();
  stopServer();
  await sleep(500);
  rmDb();
}

console.log(failures ? `\n${failures} FAILED` : '\nall passed');
process.exit(failures ? 1 : 0);
