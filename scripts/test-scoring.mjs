// Tests for the check-in scoring and the result phrase library.
// Run:  npm run test:scoring
//
// Loads the real content and the real scoring code, so it cannot drift from what
// the phone and the server do.

import { questions } from '../content/th/questions.ts';
import { allSuggestions, buildResult, stateHeadlines } from '../content/th/results.ts';
import { scoreCheckin, stateFor } from '../lib/scoring.ts';

let fail = 0;
const check = (label, ok, detail = '') => {
  if (!ok) fail += 1;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${!ok && detail ? `\n        ${detail}` : ''}`);
};
const eq = (label, got, want) => check(label, JSON.stringify(got) === JSON.stringify(want), `got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`);

/** ['a','d',...] -> one answer per question, in order. */
const answersFrom = (letters) => letters.map((c, i) => ({ questionId: questions[i].id, choiceId: c }));

// ---- 1. The brief's reference result, word for word (BRIEF section 8) ----
{
  // study 3 + 2, rest 3, overall 2, others 1 each = 14 of 24 = 58% -> drained
  const scored = scoreCheckin(answersFrom(['d', 'b', 'c', 'b', 'b', 'b', 'd', 'c']));
  eq('reference: state', scored?.state, 'drained');
  eq('reference: primary is study', scored?.primary, 'study');
  eq('reference: secondary is rest', scored?.secondary, 'rest');
  const built = buildResult(scored);
  eq('reference: headline', built.headline, 'ช่วงนี้ใช้พลังงานไปเยอะ');
  eq('reference: body', built.body, 'จากคำตอบเมื่อกี้ เรื่องเรียนดูจะเด่นที่สุด และการพักผ่อนก็น่าจะมีส่วนเหมือนกัน');
  eq('reference: topic pills', [built.primaryLabel, built.secondaryLabel], ['เรื่องเรียน', 'การพักผ่อน']);
  eq('reference: the three suggestions', built.suggestions, [
    { title: 'แบ่งงานเป็นชิ้นเล็ก ๆ', body: 'ทำให้เสร็จทีละชิ้น ดีกว่ามองทุกอย่างพร้อมกันแล้วไม่รู้จะเริ่มตรงไหน' },
    { title: 'หาเวลาพักจริง ๆ สักช่วง', body: 'ปิดแชตกลุ่มงานไปก่อนสัก 15 นาทีก็ยังดี' },
    { title: 'ลองเข้านอนเร็วขึ้นอีกนิด', body: 'เริ่มจากคืนนี้คืนเดียวก่อนก็ได้' },
  ]);
}

// ---- 2. Band boundaries (max is 24) ----
{
  const max = questions.reduce((sum, q) => sum + Math.max(...q.choices.map((c) => c.weight)), 0);
  eq('the highest possible total is 24', max, 24);
  const band = (t) => stateFor(t, max);
  eq('0-7 is ok', [0, 7].map(band), ['ok', 'ok']);
  eq('8-13 is thinking', [8, 13].map(band), ['thinking', 'thinking']);
  eq('14-18 is drained', [14, 18].map(band), ['drained', 'drained']);
  eq('19-24 is heavy', [19, 24].map(band), ['heavy', 'heavy']);
}

// ---- 3. Bad input never scores ----
eq('too few answers -> null', scoreCheckin(answersFrom(['a', 'a', 'a'])), null);
eq('a question answered twice -> null', scoreCheckin([...answersFrom(['a', 'a', 'a', 'a', 'a', 'a', 'a', 'a']).slice(0, 7), { questionId: questions[0].id, choiceId: 'b' }]), null);
eq('an unknown choice -> null', scoreCheckin(answersFrom(['a', 'a', 'a', 'a', 'a', 'a', 'a', 'z'])), null);
eq('an unknown question -> null', scoreCheckin([{ questionId: 'nope', choiceId: 'a' }, ...answersFrom(['a', 'a', 'a', 'a', 'a', 'a', 'a', 'a']).slice(1)]), null);

// ---- 4. A choice counts toward ITS OWN topic ----
{
  // q3 'c' (นอนดึกเพราะงานเยอะ) sits in a sleep question but is a study signal.
  const only = scoreCheckin(answersFrom(['a', 'a', 'c', 'a', 'a', 'a', 'a', 'a']));
  eq('q3c counts toward study, not rest', only?.primary, 'study');
}

// ---- 5. Ties go to the earlier question (BRIEF section 8) ----
{
  // pressure (q2) and freetime (q6) both 2, study/rest etc 0: pressure came first.
  const t = scoreCheckin(answersFrom(['a', 'c', 'a', 'a', 'a', 'c', 'a', 'a']));
  eq('tie: primary is the earlier topic', [t?.primary, t?.secondary], ['pressure', 'freetime']);
}

// ---- 6. Every one of the 4^8 = 65,536 answer sets ----
{
  const letters = ['a', 'b', 'c', 'd'];
  const talk = 'ลองคุยกับใครสักคน';
  const seen = { ok: 0, thinking: 0, drained: 0, heavy: 0 };
  let total = 0;
  let broken = 0;
  let first = '';
  const note = (msg) => { broken += 1; if (!first) first = msg; };

  const walk = (i, picked) => {
    if (i === questions.length) {
      total += 1;
      const r = scoreCheckin(answersFrom(picked));
      if (!r) return note(`null for ${picked.join('')}`);
      seen[r.state] += 1;
      if (r.primary === r.secondary) note(`primary = secondary for ${picked.join('')}`);
      if (r.state !== stateFor(r.total, r.max)) note(`state disagrees with total for ${picked.join('')}`);
      const b = buildResult(r);
      if (!b.headline || !b.body) note(`empty headline/body for ${picked.join('')}`);
      if (b.suggestions.length !== 3 || b.suggestions.some((s) => !s.title || !s.body)) note(`bad suggestions for ${picked.join('')}`);
      if (!b.body.includes(b.primaryLabel) || !b.body.includes(b.secondaryLabel)) note(`body does not name both topics for ${picked.join('')}`);
      if (new Set(b.suggestions.map((s) => s.title)).size !== 3) note(`repeated suggestion for ${picked.join('')}`);
      if (r.state === 'heavy' && b.suggestions[2].title !== talk) note(`heavy without the talk suggestion for ${picked.join('')}`);
      if (r.state !== 'heavy' && b.suggestions.some((s) => s.title === talk)) note(`talk suggestion outside heavy for ${picked.join('')}`);
      return;
    }
    for (const c of letters) walk(i + 1, [...picked, c]);
  };
  walk(0, []);

  eq('all 65,536 answer sets were visited', total, 65536);
  check('every answer set gives a complete, valid result', broken === 0, `${broken} broken; first: ${first}`);
  check('all four states are reachable', Object.values(seen).every((n) => n > 0), JSON.stringify(seen));
  console.log(`      spread: ${Object.entries(seen).map(([k, v]) => `${k} ${(v / total * 100).toFixed(1)}%`).join('  ')}`);
}

// ---- 7. Library hygiene ----
{
  const all = allSuggestions();
  check('22 suggestions: 7 topics x 3, plus the talk one', all.length === 22, `got ${all.length}`);
  check('no suggestion is empty', all.every((s) => s.title.trim() && s.body.trim()));
  check('every state has a headline', Object.values(stateHeadlines).every(Boolean));
  // Safety (BRIEF section 12): the site never says a student is fine or diagnoses.
  const banned = ['ปกติดี', 'ไม่เป็นไร', 'ไม่ต้องกังวล', 'ซึมเศร้า', 'วิตกกังวล', 'โรค', 'ป่วย'];
  const text = all.flatMap((s) => [s.title, s.body]).join(' ');
  check('no reassurance or diagnosis wording in the suggestions', !banned.some((w) => text.includes(w)), banned.filter((w) => text.includes(w)).join(', '));
}

console.log(fail ? `\n${fail} FAILED` : '\nall passed');
process.exit(fail ? 1 : 0);
