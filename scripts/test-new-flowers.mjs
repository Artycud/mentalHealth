// Tests for detecting new flowers on the TV. Run:  npm run test:moment
import { MAX_QUEUED, newArrivals } from '../lib/new-flowers.ts';

let fail = 0;
const eq = (label, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) fail += 1;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${ok ? '' : `\n        got ${JSON.stringify(got)}\n        want ${JSON.stringify(want)}`}`);
};

const f = (id, tint = 0) => ({ flowerId: id, name: id, tint });
// newest first, as the wall provides them
const recent = [f('e'), f('d'), f('c'), f('b'), f('a')];

eq('the very first look celebrates nothing (a reload must not replay the day)', newArrivals(null, 5, recent), []);
eq('no change celebrates nothing', newArrivals(5, 5, recent), []);
eq('one new result is that result', newArrivals(4, 5, recent).map((a) => a.flowerId), ['e']);
eq('two new results come back oldest first', newArrivals(3, 5, recent).map((a) => a.flowerId), ['d', 'e']);
eq('a total that goes DOWN (sessions deleted) celebrates nothing', newArrivals(9, 5, recent), []);
eq(`a burst is capped at ${MAX_QUEUED}, keeping the latest`, newArrivals(0, 5, recent).map((a) => a.flowerId), ['c', 'd', 'e']);
eq('a smaller cap is respected', newArrivals(0, 5, recent, 1).map((a) => a.flowerId), ['e']);
eq('it cannot invent flowers beyond what the wall listed', newArrivals(0, 50, recent.slice(0, 2)).map((a) => a.flowerId), ['d', 'e']);
eq('an empty list gives nothing, however much the total grew', newArrivals(0, 3, []), []);
eq('the arrival carries its name and colour for the screen', newArrivals(4, 5, [f('lotus', 3), ...recent]), [{ flowerId: 'lotus', name: 'lotus', tint: 3 }]);

console.log(fail ? `\n${fail} FAILED` : '\nall passed');
process.exit(fail ? 1 : 0);
