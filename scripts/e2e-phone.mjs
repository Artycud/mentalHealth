// End-to-end test of the phone experience, driven through a real browser.
// Run:  npm run test:e2e   (with `npm run dev` already running)
//
// It clicks through the check-in and the booth quiz exactly as a student would,
// and checks what appears against the scoring code itself, so the screen and the
// scoring cannot quietly disagree.
//
// Needs Chrome or Edge installed. Set CHROME_PATH if it is somewhere unusual, and
// BASE_URL if the app is not on localhost:3000. Set SHOTS=<dir> to keep
// screenshots of the key screens.

import fs from 'node:fs';
import puppeteer from 'puppeteer-core';

import { flowerFromChoices, loykrathongQuiz } from '../content/th/booth.ts';
import { questions } from '../content/th/questions.ts';
import { buildResult } from '../content/th/results.ts';
import { scoreCheckin } from '../lib/scoring.ts';

const BASE = process.env.BASE_URL ?? 'http://localhost:3000';
const SHOTS = process.env.SHOTS;

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

const browser = await puppeteer.launch({ executablePath, headless: true });
const phone = { width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true };

async function newPage(context = browser) {
  const page = await context.newPage();
  await page.setViewport(phone);
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

  // Answers chosen: a mix, ending on the heaviest, so the result is not "ok".
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
  await new Promise((r) => setTimeout(r, 500)); // longer than the auto-advance delay
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
  const cudCare = await page.evaluate(() => !!document.querySelector('#cud-care'));
  check('every result carries the CUD Care block (BRIEF section 12)', cudCare);
  await new Promise((r) => setTimeout(r, 900)); // let the reveal finish
  await shot(page, 'phone-result');

  // -- a refresh keeps the result (same tab); a brand-new tab does not
  await page.reload({ waitUntil: 'networkidle0' });
  check('a refresh of the result keeps it (same tab)', (await heading(page)) === want.headline);

  const fresh = await browser.createBrowserContext();
  const cold = await newPage(fresh);
  await cold.goto(`${BASE}/result`, { waitUntil: 'networkidle0' });
  check('a result opened with no answers says start again', (await heading(cold)) === 'เริ่มใหม่อีกรอบนะ');
  await shot(cold, 'phone-result-empty');
  await fresh.close();

  // -- "check in again" starts clean
  await page.evaluate(() => [...document.querySelectorAll('a')].find((a) => a.textContent.includes('เช็กอินอีกครั้ง'))?.click());
  await page.waitForFunction(() => location.pathname === '/checkin', { timeout: 5000 });
  await waitCounter(page, 1);
  check('"check in again" starts a new run at question 1', (await counter(page)) === 1);
  const clean = await pressed(page);
  check('with nothing pre-selected', clean.every((v) => v === false));
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

  // -- back from the result restarts the quiz rather than doing nothing
  await page.evaluate(() => history.back());
  await page.waitForFunction(() => [...document.querySelectorAll('span')].some((s) => /^\d\/3$/.test(s.textContent.trim())), { timeout: 4000 }).catch(() => {});
  check('back from a booth result returns to the quiz', /^\d\/3$/.test(await page.evaluate(() => [...document.querySelectorAll('span')].map((s) => s.textContent.trim()).find((t) => /^\d\/3$/.test(t)) ?? '')));
  await page.close();
}

// =========================================================================
// 3. The plain 404
// =========================================================================
{
  const page = await newPage();
  const res = await page.goto(`${BASE}/no-such-page`, { waitUntil: 'networkidle0' });
  check('an unknown page is a real 404', res.status() === 404);
  check('and says so in plain Thai', (await heading(page)) === 'หน้านี้ไม่มีแล้ว');
  await page.close();
}

await browser.close();
console.log(failed ? `\n${failed} FAILED` : '\nall passed');
process.exit(failed ? 1 : 0);
