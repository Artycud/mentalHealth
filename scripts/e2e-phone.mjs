// End-to-end test, driven through a real browser: the phone check-in, the phone
// booth quiz, the booth kiosk and the TV, and what each leaves in the database.
// Run:  npm run test:e2e   (with `npm run dev` already running)
//
// It clicks through everything exactly as a student would, checks what appears
// against the scoring code itself (so the screen and the scoring cannot quietly
// disagree), and then reads the database directly to check what was saved.
//
// Needs Chrome or Edge installed. Set CHROME_PATH if it is somewhere unusual, and
// BASE_URL if the app is not on localhost:3000. Set SHOTS=<dir> to keep
// screenshots of the key screens. The database checks need the app to be using a
// local file (the default); against a remote database they are skipped.
//
// Everything it creates is deleted again at the end. It only ever removes
// sessions that started after it did.

import fs from 'node:fs';

import { createClient } from '@libsql/client';
import puppeteer from 'puppeteer-core';

import { flowerFromChoices, loykrathongQuiz } from '../content/th/booth.ts';
import { questions } from '../content/th/questions.ts';
import { buildResult } from '../content/th/results.ts';
import { scoreCheckin } from '../lib/scoring.ts';

const BASE = process.env.BASE_URL ?? 'http://localhost:3000';
const SHOTS = process.env.SHOTS;
const DB_URL = process.env.DATABASE_URL ?? 'file:./data/app.db';
const CHECK_DB = DB_URL.startsWith('file:');

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
  process.exit(2);
}

let failed = 0;
const check = (label, ok, detail = '') => {
  if (!ok) failed += 1;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${!ok && detail ? `\n        ${detail}` : ''}`);
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const db = CHECK_DB ? createClient({ url: DB_URL }) : null;
const testStart = new Date().toISOString();
const rows = async (sql, args = []) => (db ? (await db.execute({ sql, args })).rows : []);

/** Poll until a query returns what we expect: saving is asynchronous and quiet. */
async function eventually(fn, ok, timeout = 8000) {
  const end = Date.now() + timeout;
  let last;
  while (Date.now() < end) {
    last = await fn();
    if (ok(last)) return last;
    await sleep(200);
  }
  return last;
}

const browser = await puppeteer.launch({ executablePath, headless: true });
const phone = { width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true };
const tablet = { width: 1180, height: 820, deviceScaleFactor: 1, isMobile: false, hasTouch: true };
const tv = { width: 1280, height: 720, deviceScaleFactor: 1 };

async function newPage(viewport = phone, context = browser) {
  const page = await context.newPage();
  await page.setViewport(viewport);
  return page;
}

const shot = async (page, name) => {
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/${name}.png` });
};

/** "3/8" -> 3. The counter is the only span that looks like n/n. */
const counter = (page) =>
  page.evaluate(() => {
    const el = [...document.querySelectorAll('span')].find((s) => /^\d+\/\d+$/.test(s.textContent.trim()));
    return el ? Number(el.textContent.split('/')[0]) : null;
  });
const heading = (page) => page.$eval('h1', (h) => h.textContent.trim());
const answerButtons = (page) => page.$$('button[aria-pressed]');
const pressed = (page) =>
  page.$$eval('button[aria-pressed]', (bs) => bs.map((b) => b.getAttribute('aria-pressed') === 'true'));

async function waitCounter(page, n) {
  await page.waitForFunction(
    (want) => {
      const el = [...document.querySelectorAll('span')].find((s) => /^\d+\/\d+$/.test(s.textContent.trim()));
      return el && Number(el.textContent.split('/')[0]) === want;
    },
    { timeout: 4000 },
    n,
  );
}

const letters = ['a', 'b', 'c', 'd'];

// =========================================================================
// 1. The check-in, all 8 questions
// =========================================================================
{
  const page = await newPage();
  await page.goto(`${BASE}/checkin`, { waitUntil: 'networkidle0' });
  check('check-in opens on question 1 of 8', (await counter(page)) === 1);
  check('the first question is question 1 from the content', (await heading(page)) === questions[0].headline);
  await shot(page, 'phone-checkin-q1');

  // A mix, ending on the heaviest, so the result is not "ok".
  const picks = ['b', 'c', 'c', 'b', 'd', 'c', 'd', 'c'];

  // -- Q1: a tap registers immediately, and then moves on ~250ms later
  const first = (await answerButtons(page))[letters.indexOf(picks[0])];
  await first.click();
  const right = await pressed(page);
  check('a tap shows as selected straight away (no dead taps)', right[letters.indexOf(picks[0])] === true);
  await waitCounter(page, 2);
  check('it auto-advances to question 2', (await counter(page)) === 2);
  check('focus moved to the new question heading', await page.evaluate(() => document.activeElement?.tagName === 'H1'));
  check('there is no bottom button before the last question', (await page.$('button[aria-disabled]')) === null);

  // -- browser back steps back ONE question, and keeps the answer
  await page.evaluate(() => history.back());
  await waitCounter(page, 1);
  check('browser back returns to question 1', (await counter(page)) === 1);
  const kept = await pressed(page);
  check('and the answer is still selected', kept[letters.indexOf(picks[0])] === true);

  // -- forward again, then answer the rest
  await page.evaluate(() => history.forward());
  await waitCounter(page, 2);
  for (let i = 1; i < 7; i += 1) {
    (await answerButtons(page))[letters.indexOf(picks[i])].click();
    await waitCounter(page, i + 2);
  }
  check('reaches question 8 of 8', (await counter(page)) === 8);

  // -- the last question does not auto-advance; its button wakes on an answer
  const btn = () => page.$('button[aria-disabled]');
  check('the "see result" button is there but disabled at first', (await (await btn()).evaluate((b) => b.getAttribute('aria-disabled'))) === 'true');
  await (await answerButtons(page))[letters.indexOf(picks[7])].click();
  await sleep(500); // longer than the auto-advance delay
  check('question 8 does NOT auto-advance', (await counter(page)) === 8);
  check('the button enables once an answer is picked', (await (await btn()).evaluate((b) => b.getAttribute('aria-disabled'))) === 'false');
  await shot(page, 'phone-checkin-q8');

  await (await btn()).click();
  await page.waitForFunction(() => location.pathname === '/result', { timeout: 5000 });

  // -- the result matches the scoring code, exactly
  const answers = picks.map((c, i) => ({ questionId: questions[i].id, choiceId: c }));
  const want = buildResult(scoreCheckin(answers));
  await page.waitForFunction((h) => document.querySelector('h1')?.textContent.trim() === h, { timeout: 5000 }, want.headline);
  check('the result headline matches the scoring', (await heading(page)) === want.headline, `want ${want.headline}`);
  const bodyText = await page.$eval('h1 + p', (p) => p.textContent.trim());
  check('the result sentence matches the scoring', bodyText === want.body, `got ${bodyText}`);
  const titles = await page.evaluate(() => [...document.querySelectorAll('h2 ~ div span[class]')].map((s) => s.textContent.trim()));
  check('the three suggestions are on the page', want.suggestions.every((s) => titles.includes(s.title)), JSON.stringify(titles));
  check('every result carries the CUD Care block (BRIEF section 12)', await page.evaluate(() => !!document.querySelector('#cud-care')));
  await sleep(900); // let the reveal finish
  await shot(page, 'phone-result');

  // -- WHAT WAS SAVED: the run, its answers, and the server's own result
  if (CHECK_DB) {
    const saved = await eventually(
      () => rows("SELECT * FROM session WHERE mode = 'checkin' AND started_at >= ? AND completed_at IS NOT NULL ORDER BY started_at DESC", [testStart]),
      (r) => r.length >= 1,
    );
    const s = saved[0];
    check('the finished check-in was saved', !!s);
    const sc = scoreCheckin(answers);
    check(
      'saved with the server\'s own result (state and both topics)',
      s && s.result_state === sc.state && s.primary_topic === sc.primary && s.secondary_topic === sc.secondary,
      JSON.stringify(s),
    );
    check('saved under the festival the SERVER had live, not one the client sent', s && s.festival === 'loykrathong');
    check('and with only a viewport bucket for the device', s && s.device_bucket === 'mobile');
    const a = await rows('SELECT question_id, choice_id FROM answer WHERE session_id = ? ORDER BY question_id', [s?.id ?? '']);
    check('all eight answers were saved, as chosen', a.length === 8 && questions.every((q, i) => a.some((r) => r.question_id === q.id && r.choice_id === picks[i])), JSON.stringify(a));
  }

  // -- a refresh keeps the result (same tab); a brand-new tab does not
  await page.reload({ waitUntil: 'networkidle0' });
  check('a refresh of the result keeps it (same tab)', (await heading(page)) === want.headline);

  const fresh = await browser.createBrowserContext();
  const cold = await newPage(phone, fresh);
  await cold.goto(`${BASE}/result`, { waitUntil: 'networkidle0' });
  check('a result opened with no answers says start again', (await heading(cold)) === 'เริ่มใหม่อีกรอบนะ');
  await shot(cold, 'phone-result-empty');
  await fresh.close();

  // -- "check in again" starts clean, and is a NEW session, never an edit
  const before = CHECK_DB ? (await rows('SELECT COUNT(*) n FROM session WHERE started_at >= ?', [testStart]))[0].n : 0;
  await page.evaluate(() => [...document.querySelectorAll('a')].find((a) => a.textContent.includes('เช็กอินอีกครั้ง'))?.click());
  await page.waitForFunction(() => location.pathname === '/checkin', { timeout: 5000 });
  await waitCounter(page, 1);
  check('"check in again" starts a new run at question 1', (await counter(page)) === 1);
  check('with nothing pre-selected', (await pressed(page)).every((v) => v === false));
  if (CHECK_DB) {
    const after = await eventually(
      async () => (await rows('SELECT COUNT(*) n FROM session WHERE started_at >= ?', [testStart]))[0].n,
      (n) => Number(n) > Number(before),
    );
    check('and it made a NEW session, leaving the finished one alone', Number(after) === Number(before) + 1, `before ${before}, after ${after}`);
  }
  await page.close();
}

// =========================================================================
// 2. The booth quiz on a phone, every one of the 18 answer paths
// =========================================================================
{
  const page = await newPage();
  const sizes = loykrathongQuiz.map((q) => q.choices.length);
  let bad = 0;
  let firstBad = '';
  let ran = 0;
  const boothStart = new Date().toISOString();

  for (let a = 0; a < sizes[0]; a += 1) {
    for (let b = 0; b < sizes[1]; b += 1) {
      for (let c = 0; c < sizes[2]; c += 1) {
        const idx = [a, b, c];
        const pairs = loykrathongQuiz.map((q, i) => ({ questionId: q.id, choiceId: q.choices[idx[i]].id }));
        const want = flowerFromChoices(pairs);

        await page.goto(`${BASE}/booth`, { waitUntil: 'networkidle0' });
        for (let q = 0; q < 3; q += 1) {
          await (await answerButtons(page))[idx[q]].click();
          if (q < 2) await waitCounter(page, q + 2);
        }
        await page.waitForFunction(() => document.querySelector('button[aria-disabled="false"]'), { timeout: 3000 });
        await page.click('button[aria-disabled="false"]');
        await page.waitForFunction((n) => document.querySelector('h1')?.textContent.trim() === n, { timeout: 4000 }, want.name).catch(() => {});
        const got = await heading(page).catch(() => '');
        ran += 1;
        if (got !== want.name) {
          bad += 1;
          if (!firstBad) firstBad = `${idx.join(',')} -> showed ${got}, wanted ${want.name}`;
        }
        if (a === 0 && b === 0 && c === 0) await shot(page, 'phone-booth-result');
      }
    }
  }
  check(`the phone booth showed the right flower on all ${ran} answer paths`, bad === 0 && ran === 18, firstBad);

  // -- and what it SAVED is the same fair spread: each flower exactly 3 times
  if (CHECK_DB) {
    const tally = await eventually(
      async () => {
        const r = await rows("SELECT booth_result f, COUNT(*) n FROM session WHERE mode = 'booth' AND started_at >= ? AND completed_at IS NOT NULL GROUP BY booth_result", [boothStart]);
        return Object.fromEntries(r.map((x) => [x.f, Number(x.n)]));
      },
      (t) => Object.values(t).reduce((s, n) => s + n, 0) >= 18,
      12000,
    );
    check('the 18 saved booth results are 3 of each of the six flowers', Object.keys(tally).length === 6 && Object.values(tally).every((n) => n === 3), JSON.stringify(tally));
  }

  // -- back from the result restarts the quiz rather than doing nothing
  await page.evaluate(() => history.back());
  await page.waitForFunction(() => [...document.querySelectorAll('span')].some((s) => /^\d\/3$/.test(s.textContent.trim())), { timeout: 4000 }).catch(() => {});
  check('back from a booth result returns to the quiz', /^\d\/3$/.test(await page.evaluate(() => [...document.querySelectorAll('span')].map((s) => s.textContent.trim()).find((t) => /^\d\/3$/.test(t)) ?? '')));
  await page.close();
}

// =========================================================================
// 3. THE RULE: the student never waits on the network (BRIEF section 3)
// =========================================================================
{
  const page = await newPage();
  await page.setRequestInterception(true);
  let blocked = 0;
  page.on('request', (req) => {
    if (req.url().includes('/api/session')) {
      blocked += 1;
      req.abort('failed'); // as if the wifi had dropped
    } else req.continue();
  });
  const t0 = Date.now();
  await page.goto(`${BASE}/checkin`, { waitUntil: 'networkidle0' });
  for (let i = 0; i < 7; i += 1) {
    (await answerButtons(page))[0].click();
    await waitCounter(page, i + 2);
  }
  await (await answerButtons(page))[0].click();
  await page.waitForFunction(() => document.querySelector('button[aria-disabled="false"]'), { timeout: 3000 });
  await page.click('button[aria-disabled="false"]');
  await page.waitForFunction(() => location.pathname === '/result', { timeout: 5000 });
  const want = buildResult(scoreCheckin(questions.map((q) => ({ questionId: q.id, choiceId: 'a' }))));
  await page.waitForFunction((h) => document.querySelector('h1')?.textContent.trim() === h, { timeout: 5000 }, want.headline);
  check('with the API completely unreachable the student still gets their result', (await heading(page)) === want.headline);
  check('and the whole run took no longer than a normal one', Date.now() - t0 < 15000, `${Date.now() - t0}ms`);
  const text = await page.evaluate(() => document.body.innerText);
  check('and shows no saving error, spinner or warning', !/error|ล้มเหลว|ผิดพลาด|ไม่สำเร็จ|กำลังบันทึก|กำลังโหลด/i.test(text));
  check('(the app really did try to save, and was really blocked)', blocked > 0, `blocked ${blocked}`);
  await page.close();
}

// =========================================================================
// 4. The kiosk and the TV, on their own devices
// =========================================================================
{
  const tvPage = await newPage(tv);
  await tvPage.goto(`${BASE}/booth/display`, { waitUntil: 'networkidle0' });
  const readCount = () => tvPage.$eval('[class*="countNum"]', (n) => Number(n.textContent.trim()));
  const startCount = await readCount();
  await tvPage.evaluate(() => { window.__stillHere = 'no reload'; });
  check('the TV shows a real, non-invented count', (await tvPage.evaluate(() => !document.body.innerText.includes('ตัวอย่าง'))));
  await shot(tvPage, 'tv-live-before');

  const kiosk = await newPage(tablet);
  await kiosk.goto(`${BASE}/booth/kiosk`, { waitUntil: 'networkidle0' });
  check('the kiosk opens on its own idle screen', (await heading(kiosk)) === 'คุณเป็นดอกไม้แบบไหน?');
  await kiosk.evaluate(() => [...document.querySelectorAll('button')].find((b) => b.textContent.includes('เริ่มเลย'))?.click());
  const flowerWanted = flowerFromChoices(loykrathongQuiz.map((q) => ({ questionId: q.id, choiceId: q.choices[0].id })));
  for (let i = 0; i < 3; i += 1) {
    await kiosk.waitForFunction((h) => document.querySelector('h1')?.textContent.trim() === h, { timeout: 4000 }, loykrathongQuiz[i].headline);
    await sleep(400); // the slide-in
    await (await answerButtons(kiosk))[0].click();
  }
  await kiosk.waitForFunction((n) => document.querySelector('h1')?.textContent.trim() === n, { timeout: 5000 }, flowerWanted.name);
  check(`the kiosk shows the right flower (${flowerWanted.name})`, (await heading(kiosk)) === flowerWanted.name);
  await sleep(900);
  await shot(kiosk, 'kiosk-result');

  if (CHECK_DB) {
    const s = (await eventually(
      () => rows("SELECT * FROM session WHERE mode = 'booth' AND device_bucket = 'tablet' AND started_at >= ? AND completed_at IS NOT NULL", [testStart]),
      (r) => r.length >= 1,
    ))[0];
    check('the kiosk saved its result, as a tablet-sized device', !!s && s.booth_result === flowerWanted.id, JSON.stringify(s));
  }

  // -- the TV notices, on its own, without reloading. Headless Chrome shows only
  // the newest tab, and the TV deliberately stops refreshing while its tab is
  // hidden (as a real hidden tab would), so bring it back to the front first.
  await tvPage.bringToFront();
  const grew = await eventually(readCount, (n) => n > startCount, 14000);
  check('the TV count went up by itself within a few seconds', grew > startCount, `${startCount} -> ${grew}`);
  check('without the page reloading', (await tvPage.evaluate(() => window.__stillHere)) === 'no reload');
  await shot(tvPage, 'tv-live-after');

  // -- the kiosk puts itself back to idle for the next student
  await kiosk.evaluate(() => [...document.querySelectorAll('button')].find((b) => b.textContent.includes('เล่นอีกครั้ง'))?.click());
  check('"play again" returns the kiosk to its idle screen', (await heading(kiosk)) === 'คุณเป็นดอกไม้แบบไหน?');
  await kiosk.close();
  await tvPage.close();
}

// =========================================================================
// 5. The plain 404
// =========================================================================
{
  const page = await newPage();
  const res = await page.goto(`${BASE}/no-such-page`, { waitUntil: 'networkidle0' });
  check('an unknown page is a real 404', res.status() === 404);
  check('and says so in plain Thai', (await heading(page)) === 'หน้านี้ไม่มีแล้ว');
  await page.close();
}

// ---- clean up: only what this run created ----
if (db) {
  await db.execute({ sql: 'DELETE FROM answer WHERE session_id IN (SELECT id FROM session WHERE started_at >= ?)', args: [testStart] });
  await db.execute({ sql: 'DELETE FROM session WHERE started_at >= ?', args: [testStart] });
  db.close();
}
await browser.close();
console.log(failed ? `\n${failed} FAILED` : '\nall passed');
process.exit(failed ? 1 : 0);
