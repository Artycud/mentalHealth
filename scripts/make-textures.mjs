// Renders the two grain tiles in public/textures/. Run:  npm run textures
//
// They are committed, so nobody has to run this to build the site; it exists so the
// grain can be re-tuned and reproduced. Drawn with an SVG noise filter in a real
// browser, then saved as small seamless transparent PNGs, because a live noise filter
// is unreliable on older iPhones and costly on a TV stick.
//
//   paper-grain.png  (and paper-grain-2x.png for dense screens) a near-invisible paper fibre for the page background. Balanced:
//                    dark and light flecks, so it adds tooth without shifting the
//                    colour of the paper.
//   ink-speckle.png  sparse, fine flecks of bare paper, laid over solid inks (bars,
//                    blobs, water) like an uneven print. Never put it behind text.
//
// Needs Chrome or Edge (like test:e2e). Uses `sharp` to shrink the files when it is
// installed (Next.js brings it); without it the PNGs are simply larger.
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import puppeteer from 'puppeteer-core';

const require = createRequire(import.meta.url);
// Each tile is drawn twice: at 192px for ordinary screens, and at 384px (the same
// pattern, sampled twice as finely) for high-density ones, so grain is crisp on a
// retina phone instead of a 192px image stretched to twice its size.
const SIZE = 192;
const OUT = path.resolve(import.meta.dirname, '../public/textures');

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

/** feColorMatrix that paints one flat colour and takes its alpha from the noise. */
const paint = (rgb, slope, offset) =>
  `0 0 0 0 ${rgb[0]}  0 0 0 0 ${rgb[1]}  0 0 0 0 ${rgb[2]}  ${slope} 0 0 0 ${offset}`;

const svg = (body, px) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}">${body}</svg>`;

/** `k` is 1 for the 192px tile and 2 for the 384px one: frequencies halve as pixels double. */
const tiles = (px, k) => ({
  'paper-grain': svg(`
    <filter id="d" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency="${0.85 / k} ${0.45 / k}" numOctaves="3" seed="4" stitchTiles="stitch"/>
      <feColorMatrix values="${paint([0.42, 0.29, 0.16], 0.34, -0.19)}"/>
    </filter>
    <filter id="l" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency="${0.7 / k} ${0.95 / k}" numOctaves="3" seed="19" stitchTiles="stitch"/>
      <feColorMatrix values="${paint([1, 0.98, 0.94], 0.42, -0.25)}"/>
    </filter>
    <rect width="${px}" height="${px}" filter="url(#d)"/>
    <rect width="${px}" height="${px}" filter="url(#l)"/>`, px),
  'ink-speckle': svg(`
    <filter id="s" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency="${0.6 / k}" numOctaves="3" seed="11" stitchTiles="stitch"/>
      <feColorMatrix values="${paint([0.99, 0.95, 0.9], 2.4, -1.66)}"/>
    </filter>
    <rect width="${px}" height="${px}" filter="url(#s)"/>`, px),
});

let sharp = null;
try {
  sharp = require('sharp');
} catch {
  console.log('(sharp not found: writing unshrunk PNGs)');
}

fs.mkdirSync(OUT, { recursive: true });
const tmp = fs.mkdtempSync(path.join(OUT, '.tmp-'));
const browser = await puppeteer.launch({ executablePath, headless: true });
try {
  const page = await browser.newPage();
  for (const [suffix, k] of [['', 1], ['-2x', 2]]) {
    const px = SIZE * k;
    await page.setViewport({ width: px, height: px });
    for (const [name, source] of Object.entries(tiles(px, k))) {
      const file = path.join(tmp, `${name}${suffix}.svg`);
      fs.writeFileSync(file, source);
      await page.goto(pathToFileURL(file).href);
      const raw = await page.screenshot({ omitBackground: true });
      const png = sharp
        ? await sharp(raw).png({ palette: true, colours: 48, dither: 0, effort: 10 }).toBuffer()
        : raw;
      fs.writeFileSync(path.join(OUT, `${name}${suffix}.png`), png);
      console.log(`${name}${suffix}.png  ${px}x${px}  ${(png.length / 1024).toFixed(1)} KB`);
    }
  }
} finally {
  await browser.close();
  fs.rmSync(tmp, { recursive: true, force: true });
}
