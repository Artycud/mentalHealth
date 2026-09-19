// The theme's guard rails. Run:  npm run check:theme
//
// The look is a base identity plus a swappable festival layer (see app/globals.css and
// app/festivals/). Three things keep that true, and all three are checked here from
// the real files, not from a list kept in someone's head:
//
//   1. Legibility. Every text/background pairing the design uses meets its contrast
//      ratio, computed from the actual tokens (a festival's own colours included).
//   2. The festival layer stays a layer. A festival file may set ONLY the scene
//      variables and only under its own [data-festival] selector, and the base (global
//      CSS, ui, illustrations, quiz, student pages) never names a festival.
//   3. No technical marks. The crosshairs and halftone dots that made it read as a
//      tech poster must not creep back in.
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');

let failures = 0;
const check = (ok, label, detail = '') => {
  if (!ok) failures += 1;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${!ok && detail ? `\n        ${detail}` : ''}`);
};

/** All files under `dir` (relative to the project root) with one of `exts`. */
function files(dir, exts) {
  const out = [];
  const walk = (d) => {
    for (const entry of fs.readdirSync(path.join(root, d), { withFileTypes: true })) {
      const rel = `${d}/${entry.name}`;
      if (entry.isDirectory()) walk(rel);
      else if (exts.some((e) => entry.name.endsWith(e))) out.push(rel);
    }
  };
  walk(dir);
  return out;
}

// ---- tokens ----

/** `--name: value;` declarations inside one CSS block body. */
function declarations(body) {
  const out = {};
  for (const m of body.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) out[m[1]] = m[2].trim();
  return out;
}

const globals = read('app/globals.css');
// The first :root block holds the design tokens.
const rootBody = globals.slice(globals.indexOf(':root {') + 7, globals.indexOf('\n}\n', globals.indexOf(':root {')));
const base = declarations(rootBody);

/** Resolves var(--x) chains to a hex colour, or null if it is not a plain colour. */
function colour(value, scope) {
  let v = value;
  for (let i = 0; i < 8; i += 1) {
    const ref = /^var\((--[\w-]+)\)$/.exec(v);
    if (!ref) break;
    v = scope[ref[1]] ?? base[ref[1]];
    if (v === undefined) return null;
  }
  return /^#[0-9a-f]{6}$/i.test(v) ? v.toUpperCase() : null;
}

const channel = (c) => {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};
const luminance = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => channel(parseInt(hex.slice(i, i + 2), 16)));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

// ---- 1. legibility ----

const tok = (name) => {
  const c = colour(`var(${name})`, base);
  if (!c) throw new Error(`${name} is not a plain colour in app/globals.css`);
  return c;
};

// [text, background, minimum ratio, where it is used]. 7 is WCAG AAA for body text,
// which is what a screen read across a canteen should meet; 4.5 (AA) is the floor for
// anything smaller or secondary.
const PAIRS = [
  ['--ink', '--paper', 7, 'body and headings on the page'],
  ['--ink', '--paper-raised', 7, 'answer cards'],
  ['--ink', '--pink-tint', 7, 'CUD Care block, selected answer'],
  ['--ink', '--sun-tint', 7, 'booth ticket'],
  ['--ink', '--track', 7, 'text over an empty bar or a chip'],
  ['--ink-soft', '--paper', 4.5, 'secondary text'],
  ['--ink-soft', '--paper-raised', 4.5, 'secondary text on a card'],
  ['--ink-muted', '--paper', 4.5, 'footer text'],
  ['--note-pink', '--paper', 4.5, 'handwritten notes'],
  ['--white', '--ink', 7, 'text on a navy button'],
];
for (const [fg, bg, min, where] of PAIRS) {
  const ratio = contrast(tok(fg), tok(bg));
  check(ratio >= min, `${fg} on ${bg} is ${ratio.toFixed(1)}:1 (needs ${min}:1) — ${where}`);
}

// ---- 2. the festival layer ----

const ALLOWED = ['--accent', '--fest-far', '--fest-near', '--fest-light', '--fest-glow', '--fest-on-water'];
const festivalFiles = files('app/festivals', ['.css']);
check(festivalFiles.length > 0, 'there is at least one festival file');

for (const rel of festivalFiles) {
  const css = read(rel).replace(/\/\*[\s\S]*?\*\//g, '');
  const blocks = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)];
  const id = path.basename(rel, '.css');

  const selectors = blocks.map((b) => b[1].trim());
  check(
    selectors.length > 0 && selectors.every((s) => s === `[data-festival='${id}']`),
    `${rel}: every rule is scoped to [data-festival='${id}'] and nothing else`,
    `found: ${selectors.join(' | ')}`,
  );

  const props = blocks.flatMap((b) => [...b[2].matchAll(/([\w-]+)\s*:/g)].map((m) => m[1]));
  const stray = props.filter((p) => !ALLOWED.includes(p));
  check(stray.length === 0, `${rel}: sets only the scene variables`, `not allowed: ${stray.join(', ')}`);

  // Its own colours, read with the base tokens behind them.
  const scope = Object.assign({}, ...blocks.map((b) => declarations(b[2])));
  const onWater = colour(scope['--fest-on-water'] ?? '', scope);
  const near = colour(scope['--fest-near'] ?? '', scope);
  if (onWater && near) {
    const ratio = contrast(onWater, near);
    check(ratio >= 7, `${rel}: text on the water is ${ratio.toFixed(1)}:1 (needs 7:1)`);
  } else {
    check(false, `${rel}: --fest-on-water and --fest-near are plain colours`);
  }
}

// The base never names a festival, and never defines a scene variable itself.
const FESTIVAL_NAME = /loykrathong|christmas|cny-valentine|krathong/i;
// Known gap, on purpose: the booth screens (components/booth/, app/booth/ and
// app/(student)/booth/) import the Loy Krathong quiz and flowers by name, because that
// is the only festival with content. They are the festival's CONTENT, not its look; the
// day a second festival has a quiz, they should read it through the active festival
// instead, and move into the checked set below.
const baseFiles = [
  'app/globals.css',
  ...files('components/ui', ['.css', '.tsx']),
  ...files('components/illustrations', ['.css', '.tsx']),
  ...files('components/quiz', ['.css', '.tsx']),
  ...files('app/(student)', ['.css', '.tsx']).filter((rel) => !rel.startsWith('app/(student)/booth/')),
];
let baseProblems = 0;
for (const rel of baseFiles) {
  const text = read(rel);
  // Comments may talk about festivals; code may not.
  const code = text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '');
  if (FESTIVAL_NAME.test(code)) {
    baseProblems += 1;
    check(false, `${rel} names a festival (the base must not)`);
  }
  if (rel !== 'app/globals.css' && /--fest-[\w-]+\s*:/.test(code)) {
    baseProblems += 1;
    check(false, `${rel} defines a --fest variable (only festival files may)`);
  }
}
check(!/--fest-[\w-]+\s*:/.test(globals), 'app/globals.css defines no --fest variable (it only sets defaults)');
check(baseProblems === 0, `the base (${baseFiles.length} files) names no festival and defines no scene variable`);

// ---- 3. no technical marks ----

const drawn = [...files('components', ['.tsx']), ...files('app', ['.tsx'])];
const marks = drawn.filter((rel) => /riso-halftone|<Halftone|<Plus\b|ln-thin[^\n]*offset/.test(read(rel)));
check(marks.length === 0, 'no crosshair or halftone marks in the illustrations', marks.join(', '));

console.log(failures ? `\n${failures} FAILED` : '\nall passed');
process.exit(failures ? 1 : 0);
