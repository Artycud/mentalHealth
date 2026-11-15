// Tests for "รู้จักตัวเองอีกนิด": the questions are balanced, and every possible
// set of answers gives a type the page has words for.
// Run:  npm run test:mbti
//
// Loads the real content and the real scoring code.

import { axes, mbtiQuestions, mbtiTypes } from '../content/th/mbti.ts';
import { AXES, scoreMbti } from '../lib/mbti.ts';

let fail = 0;
const check = (label, ok, detail = '') => {
  if (!ok) fail += 1;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${!ok && detail ? `\n        ${detail}` : ''}`);
};

// ---- the questions ----
check('12 questions', mbtiQuestions.length === 12, `got ${mbtiQuestions.length}`);
for (const axis of AXES) {
  const mine = mbtiQuestions.filter((q) => q.axis === axis);
  check(`${axis}: an odd number of questions (no ties)`, mine.length % 2 === 1, `got ${mine.length}`);
  const [a, b] = axis.split('');
  check(
    `${axis}: every question offers one answer for each end`,
    mine.every((q) => q.options.map((o) => o.pole).sort().join('') === [a, b].sort().join('')),
  );
  const firsts = new Set(mine.map((q) => q.options[0].pole));
  check(`${axis}: which end is offered first changes (top-tapping cannot make a type)`, firsts.size === 2);
  check(`${axis}: both ends are described`, Boolean(axes[axis].poles[a] && axes[axis].poles[b]));
}
check(
  'no two questions in a row ask about the same side',
  mbtiQuestions.every((q, i) => i === 0 || q.axis !== mbtiQuestions[i - 1].axis),
);
check('every question and answer has words', mbtiQuestions.every((q) => q.ask && q.options.every((o) => o.text)));

// ---- every possible set of answers ----
let bad = 0;
const seen = new Set();
for (let mask = 0; mask < 1 << mbtiQuestions.length; mask++) {
  const answers = mbtiQuestions.map((q, i) => q.options[(mask >> i) & 1].pole);
  const r = scoreMbti(answers);
  if (!r || !mbtiTypes[r.type] || r.sides.some((s) => s.votes * 2 <= s.of)) bad += 1;
  else seen.add(r.type);
}
check('all 4096 answer sets give a type the page has words for, each side a clear majority', bad === 0, `${bad} did not`);
check('all 16 types can come out', seen.size === 16, `only ${seen.size}`);
check('16 types written, each with a name, a line, a strength and a care tip', Object.keys(mbtiTypes).length === 16 && Object.values(mbtiTypes).every((t) => t.name && t.line && t.strength && t.care));

// ---- unfinished answers give nothing ----
check('an unfinished set gives no result', scoreMbti(mbtiQuestions.slice(1).map((q) => q.options[0].pole)) === undefined);

// ---- always the top answer, always the bottom: not one extreme type ----
const top = scoreMbti(mbtiQuestions.map((q) => q.options[0].pole));
const bottom = scoreMbti(mbtiQuestions.map((q) => q.options[1].pole));
check('tapping the top answer every time does not give a clear-cut result', top.sides.some((s) => s.votes < s.of), top.type);
check('nor does tapping the bottom one', bottom.sides.some((s) => s.votes < s.of), bottom.type);

console.log(fail ? `\n${fail} FAILED` : '\nall passed');
process.exit(fail ? 1 : 0);
