// Enumerates every possible set of booth answers and reports how often each
// flower comes up. Reads the REAL quiz and the REAL scoring function from
// content/th/booth.ts, so it cannot drift from what the kiosk does.
//
// Run it after editing any booth question or its points:  npm run check:booth
//
// It exists because the booth hands out PHYSICAL flowers. A lopsided quiz means
// the booth runs out of some and is left holding a pile of others. Rewording an
// answer is safe; moving its points is what can unbalance this.

import { flowerFromPoints, loykrathongFlowers, loykrathongQuiz } from '../content/th/booth.ts';

// Ideal is 1/6 = 16.7%. The real quiz sits at 14-19%. The band is deliberately
// tight: a first version used 10-25% and passed a quiz whose third question did
// nothing at all, because even that lopsided quiz stayed inside it.
const MIN = 0.12;
const MAX = 0.22;

const counts = new Map(loykrathongFlowers.map((f) => [f.id, 0]));
let total = 0;

function walk(q, pts) {
  if (q === loykrathongQuiz.length) {
    const id = flowerFromPoints(pts).id;
    counts.set(id, counts.get(id) + 1);
    total += 1;
    return;
  }
  for (const choice of loykrathongQuiz[q].choices) walk(q + 1, [...pts, choice.points]);
}
walk(0, []);

console.log(
  `${total} possible answer sets, ${loykrathongFlowers.length} flowers (ideal ${(100 / loykrathongFlowers.length).toFixed(1)}% each)\n`,
);

let bad = 0;
for (const f of loykrathongFlowers) {
  const n = counts.get(f.id);
  const share = n / total;
  const ok = share >= MIN && share <= MAX;
  if (!ok) bad += 1;
  console.log(
    `${ok ? 'ok  ' : 'FAIL'} ${f.name.padEnd(16)} ${String(n).padStart(3)}/${total}  ${(share * 100).toFixed(1).padStart(5)}%  ${'#'.repeat(n)}`,
  );
}

// Every answer must count differently. If two answers to one question add the
// same points, picking either gives the same flower, so that choice is
// decoration — and a question where they all match does nothing at all.
console.log('');
let dup = 0;
for (const q of loykrathongQuiz) {
  const effects = new Set(q.choices.map((c) => c.points % loykrathongFlowers.length));
  const ok = effects.size === q.choices.length;
  if (!ok) dup += 1;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${q.id}: ${q.choices.length} answers, ${effects.size} distinct effects`);
}

console.log('');
if (bad) console.log(`${bad} flower(s) outside ${MIN * 100}-${MAX * 100}%. Rebalance the points before the booth.`);
if (dup) console.log(`${dup} question(s) have answers that count the same. Give each answer its own points.`);
if (!bad && !dup) {
  console.log(`Balanced: every flower between ${MIN * 100}% and ${MAX * 100}%, and every answer counts.`);
}
process.exit(bad || dup ? 1 : 0);
