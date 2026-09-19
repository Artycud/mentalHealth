// Enumerates every possible set of booth answers and reports how often each
// flower comes up. Reads the REAL quiz and the REAL scoring function from
// content/th/booth.ts, so it cannot drift from what the kiosk does.
//
// Run it after editing any booth question or answer:  npm run check:booth
//
// It exists because the booth hands out PHYSICAL flowers. A lopsided quiz means
// the booth runs out of some and is left holding a pile of others. Rewording an
// answer is safe; changing which value it carries, or how many answers a
// question has, is what can unbalance this.

import { flowerFromAnswers, loykrathongFlowers, loykrathongQuiz } from '../content/th/booth.ts';

// Ideal is 1/6 = 16.7%, and the current design hits it exactly. The band is
// deliberately tight: an earlier version of this check used 10-25% and passed a
// quiz whose third question did nothing at all.
const MIN = 0.12;
const MAX = 0.22;

const counts = new Map(loykrathongFlowers.map((f) => [f.id, 0]));
let total = 0;
const outcomes = []; // outcomes[i] = flower id for the i-th answer set, in walk order

function walk(q, answers) {
  if (q === loykrathongQuiz.length) {
    const id = flowerFromAnswers(answers).id;
    counts.set(id, counts.get(id) + 1);
    outcomes.push(id);
    total += 1;
    return;
  }
  const question = loykrathongQuiz[q];
  for (const choice of question.choices) {
    walk(q + 1, [...answers, { axis: question.axis, value: choice.value }]);
  }
}
walk(0, []);

console.log(
  `${total} possible answer sets, ${loykrathongFlowers.length} flowers (ideal ${(100 / loykrathongFlowers.length).toFixed(1)}% each)\n`,
);

let bad = 0;
for (const f of loykrathongFlowers) {
  const n = counts.get(f.id);
  const share = n / total;
  const reachable = n > 0;
  const ok = reachable && share >= MIN && share <= MAX;
  if (!ok) bad += 1;
  console.log(
    `${ok ? 'ok  ' : 'FAIL'} ${f.name.padEnd(16)} ${String(n).padStart(3)}/${total}  ${(share * 100).toFixed(1).padStart(5)}%  ${'#'.repeat(n)}${reachable ? '' : '  (UNREACHABLE)'}`,
  );
}

// 1. Every answer to a question must count differently. If two match, picking
//    either gives the same flower, so that choice is decoration.
console.log('');
let dup = 0;
for (const q of loykrathongQuiz) {
  const values = new Set(q.choices.map((c) => c.value));
  const ok = values.size === q.choices.length;
  if (!ok) dup += 1;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${q.id} (${q.axis}): ${q.choices.length} answers, ${values.size} distinct values`);
}

// 2. Every question must be able to change the outcome. Flip one question's
//    answer while holding the others fixed; if the flower never changes for any
//    setting of the others, that question is decoration.
console.log('');
let inert = 0;
for (let qi = 0; qi < loykrathongQuiz.length; qi += 1) {
  let changes = 0;
  const others = loykrathongQuiz.map((q) => q.choices);
  // Walk every combination of the OTHER questions' answers.
  const rest = loykrathongQuiz.map((_, i) => i).filter((i) => i !== qi);
  const recurse = (k, picked) => {
    if (k === rest.length) {
      const flowers = new Set();
      for (const choice of loykrathongQuiz[qi].choices) {
        const answers = loykrathongQuiz.map((q, i) => {
          const c = i === qi ? choice : picked.get(i);
          return { axis: q.axis, value: c.value };
        });
        flowers.add(flowerFromAnswers(answers).id);
      }
      if (flowers.size > 1) changes += 1;
      return;
    }
    for (const c of others[rest[k]]) recurse(k + 1, new Map(picked).set(rest[k], c));
  };
  recurse(0, new Map());
  const ok = changes > 0;
  if (!ok) inert += 1;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${loykrathongQuiz[qi].id} changes the flower in ${changes} of the other answer combinations`);
}

console.log('');
if (bad) console.log(`${bad} flower(s) unreachable or outside ${MIN * 100}-${MAX * 100}%. Rebalance before the booth.`);
if (dup) console.log(`${dup} question(s) have answers that count the same. Give each answer its own value.`);
if (inert) console.log(`${inert} question(s) never change the result, so they are decoration.`);
if (!bad && !dup && !inert) {
  console.log(`Balanced: every flower reachable and between ${MIN * 100}% and ${MAX * 100}%, and every question matters.`);
}
process.exit(bad || dup || inert ? 1 : 0);
