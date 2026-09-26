// Checks the look in a real browser. Run with `npm run dev` going:  npm run test:look
//
// It only reads pages (it writes nothing to the database), so it is safe to run
// against a database someone else is using.
//
//   - Every User Mode page (home, check-up, check-in, result, and the pages still to
//     come) carries the User Mode look and no festival scene, icon or colours,
//     however a booth is set up. The festival belongs to the booth screens only.
//   - The festival appears where it should: on the booth screens.
//   - Reduced motion really is still: nothing runs on the TV, the kiosk or the phone.
//   - The TV keeps its shape: nothing scrolls, and the water band is there.
import fs from 'node:fs';

import puppeteer from 'puppeteer-core';

const BASE = process.env.BASE_URL ?? 'http://localhost:3000';
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
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${!ok && detail ? `  (${detail})` : ''}`);
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({ executablePath, headless: true });

async function open(url, { w = 390, h = 844, reduced = false } = {}) {
  const page = await browser.newPage();
  await page.setViewport({ width: w, height: h });
  if (reduced) await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await page.goto(BASE + url, { waitUntil: 'networkidle0', timeout: 90_000 });
  await sleep(800);
  return page;
}
const festivalMarks = (page) => page.evaluate(() => document.querySelectorAll('[data-festival]').length);
const running = (page) =>
  page.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running').length);

try {
  // ---- User Mode is Mental Health Week's own look, never a festival's
  for (const [name, url] of [
    ['home', '/'],
    ['check-up', '/checkup'],
    ['check-in', '/checkin'],
    ['result', '/result'],
    ['รู้จักตัวเอง', '/me'],
    ['ระบาย', '/vent'],
  ]) {
    const page = await open(url);
    check(`${name} carries no festival layer`, (await festivalMarks(page)) === 0);
    const gloss = await page.evaluate(() => getComputedStyle(document.body).getPropertyValue('--fest-glow').trim());
    check(`${name} has no festival colours in reach`, gloss === '', `--fest-glow was "${gloss}"`);
    check(`${name} wears the User Mode look`, (await page.$("[data-home='heart']")) !== null);
    await page.close();
  }

  // ---- and the festival is where it belongs
  {
    const page = await open('/booth/display?demo=1', { w: 1920, h: 1080 });
    check('the TV is a festival screen', (await festivalMarks(page)) >= 1);
    const shape = await page.evaluate(() => {
      const de = document.documentElement;
      const band = document.querySelector('[data-festival] > div:last-of-type');
      const r = band?.getBoundingClientRect();
      return {
        noScroll: de.scrollWidth <= de.clientWidth && de.scrollHeight <= de.clientHeight,
        bandHeight: r ? Math.round((r.height / window.innerHeight) * 100) : 0,
        bandAtBottom: r ? Math.abs(r.bottom - window.innerHeight) < 2 : false,
      };
    });
    check('the TV does not scroll in either direction', shape.noScroll);
    check('the river band fills the bottom 30%', shape.bandHeight === 30 && shape.bandAtBottom, JSON.stringify(shape));
    await page.close();
  }

  // ---- reduced motion is still
  for (const [name, url, size] of [
    ['the TV', '/booth/display?demo=1', { w: 1920, h: 1080 }],
    ['the kiosk', '/booth/kiosk', { w: 1180, h: 820 }],
    ['the phone home page', '/', {}],
  ]) {
    const page = await open(url, { ...size, reduced: true });
    await sleep(1500);
    const n = await running(page);
    check(`${name} runs no animation under reduced motion`, n === 0, `${n} running`);
    await page.close();
  }
  {
    // ...while with motion allowed, the TV really is alive (so the test above means something)
    const page = await open('/booth/display?demo=1', { w: 1920, h: 1080 });
    check('the TV moves when motion is allowed', (await running(page)) > 5);
    await page.close();
  }
} finally {
  await browser.close();
}

console.log(failures ? `\n${failures} FAILED` : '\nall passed');
process.exit(failures ? 1 : 0);
