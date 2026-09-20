// Makes docs/school-server-guide.pdf from docs/school-server-guide.html. Run:  npm run docs:guide
// Needs Chrome or Edge (like test:e2e). Edit the HTML, then run this to refresh the PDF.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import puppeteer from 'puppeteer-core';

const docs = path.resolve(import.meta.dirname, '../docs');
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

const browser = await puppeteer.launch({ executablePath, headless: true });
try {
  const page = await browser.newPage();
  await page.goto(pathToFileURL(path.join(docs, 'school-server-guide.html')).href);
  const pdf = path.join(docs, 'school-server-guide.pdf');
  await page.pdf({ path: pdf, format: 'A4', printBackground: true, preferCSSPageSize: true });
  // How many pages did it come to? (Counted from the PDF's own page objects.)
  const pages = (fs.readFileSync(pdf).toString('latin1').match(/\/Type\s*\/Page[^s]/g) ?? []).length;
  console.log(`docs/school-server-guide.pdf  ${pages} page(s)  ${(fs.statSync(pdf).size / 1024).toFixed(0)} KB`);
} finally {
  await browser.close();
}
