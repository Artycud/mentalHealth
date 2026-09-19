// Tests for lib/thai-date.ts. Run:  npm run test:dates
// The dates print on the booth ticket students carry, so an off-by-one or a
// blanked page from a typo in the admin panel is worth a real test.
import { formatDateRange } from '../lib/thai-date.ts';

let fail = 0;
const eq = (label, got, want) => {
  const ok = got === want;
  if (!ok) fail += 1;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label.padEnd(40)} ${JSON.stringify(got)}${ok ? '' : `   want ${JSON.stringify(want)}`}`);
};

// The three real events from the project document.
eq('Loy Krathong 19-20 Nov 2026', formatDateRange('2026-11-19', '2026-11-20'), '19–20 พ.ย. 2569');
eq('Christmas 8-9 Dec 2026', formatDateRange('2026-12-08', '2026-12-09'), '8–9 ธ.ค. 2569');
eq('CNY/Valentine 10-11 Feb 2027', formatDateRange('2027-02-10', '2027-02-11'), '10–11 ก.พ. 2570');
// The Gantt table's readings, since the admin may pick them.
eq('Gantt reading 19-24 Nov', formatDateRange('2026-11-19', '2026-11-24'), '19–24 พ.ย. 2569');
eq('Gantt reading 10-12 Feb', formatDateRange('2027-02-10', '2027-02-12'), '10–12 ก.พ. 2570');
// Shapes an admin could enter.
eq('single day', formatDateRange('2026-11-19', '2026-11-19'), '19 พ.ย. 2569');
eq('across a month', formatDateRange('2026-11-30', '2026-12-02'), '30 พ.ย. – 2 ธ.ค. 2569');
eq('across a year', formatDateRange('2026-12-30', '2027-01-02'), '30 ธ.ค. 2569 – 2 ม.ค. 2570');
// Bad input must never throw or blank a public screen.
eq('end before start -> single day', formatDateRange('2026-11-20', '2026-11-19'), '20 พ.ย. 2569');
eq('unreadable end -> single day', formatDateRange('2026-11-19', 'nonsense'), '19 พ.ย. 2569');
eq('unreadable start -> empty', formatDateRange('', '2026-11-20'), '');
eq('31 Nov does not exist', formatDateRange('2026-11-31', '2026-11-31'), '');
eq('month 13 does not exist', formatDateRange('2026-13-01', '2026-13-02'), '');
eq('29 Feb in a non-leap year', formatDateRange('2026-02-29', '2026-02-29'), '');
eq('29 Feb in a leap year', formatDateRange('2028-02-29', '2028-02-29'), '29 ก.พ. 2571');

console.log(fail ? `\n${fail} FAILED` : '\nall passed');
process.exit(fail ? 1 : 0);
