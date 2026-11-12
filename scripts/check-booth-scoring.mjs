// Checks the booth's feeling → flower rules against the REAL quiz and scoring in
// content/th/booth.ts, so it cannot drift from what the kiosk does.
//
// Run it after editing any booth question, answer or flower:  npm run check:booth
//
// The booth hands out PHYSICAL flowers. Since 2026-11-12 the flower is the one
// "for" the student's feeling (energy × weight, the home's nine), so how many of
// each go out depends on how the room feels and cannot be balanced in advance.
// What CAN be checked, and is:
//   1. every flower is reachable, and every one of the nine feelings has a flower;
//   2. energy and weight both decide the flower, and the topic never does;
//   3. every answer to energy and weight counts differently.
// It also prints the map, so the council can see which heart gets which flower.

import { feelingFromAnswers, flowerFromAnswers, loykrathongFlowers, loykrathongQuiz } from '../content/th/booth.ts';

let bad = 0;
const fail = (msg) => {
  bad += 1;
  console.log(`FAIL ${msg}`);
};
const ok = (msg) => console.log(`ok   ${msg}`);

const byAxis = (axis) => loykrathongQuiz.find((q) => q.axis === axis);
const energy = byAxis('energy');
const weight = byAxis('weight');
const topic = byAxis('topic');
if (!energy || !weight || !topic) {
  console.log('FAIL the quiz must have an energy, a weight and a topic question');
  process.exit(1);
}

// ---- the map ----
console.log('weight \\ energy'.padEnd(18) + energy.choices.map((c) => c.label.padEnd(22)).join(''));
const counts = new Map(loykrathongFlowers.map((f) => [f.id, 0]));
for (const w of weight.choices) {
  let line = w.label.padEnd(18);
  for (const e of energy.choices) {
    const answers = [
      { axis: 'energy', value: e.value },
      { axis: 'weight', value: w.value },
      { axis: 'topic', value: 0 },
    ];
    const flower = flowerFromAnswers(answers);
    const feeling = feelingFromAnswers(answers);
    counts.set(flower.id, counts.get(flower.id) + 1);
    line += `${feeling.word} → ${flower.name}`.padEnd(22);
  }
  console.log(line);
}
console.log('');

// ---- 1. every flower reachable ----
for (const f of loykrathongFlowers) {
  const n = counts.get(f.id);
  if (n > 0) ok(`${f.name} is given for ${n} of the 9 feelings`);
  else fail(`${f.name} can never be given (no feeling maps to it)`);
}

// ---- 2. energy and weight decide it; topic never does ----
const flowerAt = (e, w, t = 0) =>
  flowerFromAnswers([
    { axis: 'energy', value: e },
    { axis: 'weight', value: w },
    { axis: 'topic', value: t },
  ]).id;
const matters = (axis) => {
  for (let a = 0; a < 3; a += 1) {
    const set = new Set([0, 1, 2].map((b) => (axis === 'energy' ? flowerAt(b, a) : flowerAt(a, b))));
    if (set.size > 1) return true;
  }
  return false;
};
for (const axis of ['energy', 'weight']) {
  if (matters(axis)) ok(`${axis} changes the flower`);
  else fail(`${axis} never changes the flower: it is decoration`);
}
let topicMatters = false;
for (let e = 0; e < 3; e += 1) {
  for (let w = 0; w < 3; w += 1) {
    const set = new Set(topic.choices.map((c) => flowerAt(e, w, c.value)));
    if (set.size > 1) topicMatters = true;
  }
}
if (topicMatters) fail('the topic changes the flower; it must not');
else ok('the topic never changes the flower');

// ---- 3. distinct answers ----
for (const q of [energy, weight]) {
  const values = new Set(q.choices.map((c) => c.value));
  if (values.size === q.choices.length && q.choices.length === 3) ok(`${q.id}: 3 answers, 3 distinct values`);
  else fail(`${q.id}: needs exactly 3 answers with distinct values (0, 1, 2)`);
}

console.log(bad ? `\n${bad} problem(s)` : '\nEvery flower reachable, and only energy and weight decide it.');
process.exit(bad ? 1 : 0);
