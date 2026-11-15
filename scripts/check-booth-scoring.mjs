// Checks the booth's answers → feeling → flower rules against the REAL quiz and
// scoring in content/th/booth.ts, so it cannot drift from what the kiosk does.
//
// Run it after editing any booth question, answer or flower:  npm run check:booth
//
// The booth hands out PHYSICAL flowers, one for each of six feelings, from the
// student council's five questions (2026-11-16). What is checked:
//   1. every question offers each of the six feelings exactly once;
//   2. every possible set of answers (6^5) gives a flower, at one of two levels;
//   3. every flower can come out, at both levels;
//   4. a tie goes to the feeling answered latest, and 3+ of 5 is the strong level.
// It also prints how often each flower comes out if every answer were equally
// likely, so the council can see the spread before buying stock (real students
// will not answer evenly, so stock by the staff's tally on the day).

import { EMOTIONS, loykrathongFlowers, loykrathongQuiz, resultFromChoices, resultFromEmotions } from '../content/th/booth.ts';

let bad = 0;
const fail = (msg) => {
  bad += 1;
  console.log(`FAIL ${msg}`);
};
const ok = (msg) => console.log(`PASS ${msg}`);

// ---- 1. each question offers each feeling once ----
for (const q of loykrathongQuiz) {
  const ids = q.choices.map((c) => c.id).sort().join(',');
  if (ids !== [...EMOTIONS].sort().join(',')) fail(`${q.id} does not offer each of the six feelings once: ${ids}`);
}
if (loykrathongQuiz.length !== 5) fail(`expected 5 questions, found ${loykrathongQuiz.length}`);
for (const e of EMOTIONS) if (!loykrathongFlowers.some((f) => f.emotion === e)) fail(`no flower for ${e}`);
if (!bad) ok('5 questions, each offering the six feelings once, and a flower for every feeling');

// ---- 2 & 3. every set of answers ----
const counts = new Map(loykrathongFlowers.map((f) => [f.id, [0, 0]]));
let total = 0;
const walk = (i, pairs) => {
  if (i === loykrathongQuiz.length) {
    const r = resultFromChoices(pairs);
    if (!r) return fail(`no result for ${JSON.stringify(pairs)}`);
    counts.get(r.flower.id)[r.level] += 1;
    total += 1;
    return;
  }
  for (const c of loykrathongQuiz[i].choices) walk(i + 1, [...pairs, { questionId: loykrathongQuiz[i].id, choiceId: c.id }]);
};
walk(0, []);
if (total === 6 ** 5) ok(`all ${total} sets of answers give a flower`);
else fail(`only ${total} of ${6 ** 5} sets of answers were scored`);
for (const f of loykrathongFlowers) {
  const [mild, strong] = counts.get(f.id);
  if (!mild || !strong) fail(`${f.name} cannot come out at both levels (a little ${mild}, a lot ${strong})`);
}
if (!bad) ok('every flower can come out, at both levels');

// ---- 4. the rules ----
const r1 = resultFromEmotions(['sad', 'sad', 'angry', 'angry', 'happy']);
if (r1.flower.emotion !== 'angry' || r1.level !== 0) fail(`a 2–2 tie should go to the later feeling (angry), mild; got ${r1.flower.emotion}, level ${r1.level}`);
const r2 = resultFromEmotions(['worried', 'worried', 'worried', 'love', 'love']);
if (r2.flower.emotion !== 'worried' || r2.level !== 1 || r2.score !== 3) fail(`3 of 5 should be worried, strong; got ${JSON.stringify(r2)}`);
const r3 = resultFromEmotions(['happy', 'sad', 'angry', 'excited', 'love']);
if (r3.flower.emotion !== 'love' || r3.level !== 0 || r3.score !== 1) fail(`all different should go to the last answer (love), mild; got ${r3.flower.emotion}`);
if (resultFromChoices([{ questionId: 'q1', choiceId: 'sad' }]) !== null) fail('an unfinished set of answers must give no result');
if (!bad) ok('ties go to the feeling answered latest; 3 or more of 5 is the strong level; unfinished gives nothing');

// ---- the spread, if every answer were equally likely ----
console.log('\nIf every answer were equally likely (real students will not be):');
for (const f of loykrathongFlowers) {
  const [mild, strong] = counts.get(f.id);
  const pct = (n) => `${((n / total) * 100).toFixed(1)}%`;
  console.log(`  ${f.name.padEnd(18)} ${pct(mild + strong).padStart(6)}   (a little ${pct(mild)}, a lot ${pct(strong)})`);
}

console.log(bad ? `\n${bad} FAILED` : '\nall passed');
process.exit(bad ? 1 : 0);
