/**
 * Thai date formatting, with no imports so it can be tested on its own.
 *
 * Events are stored as ISO calendar dates ("2026-11-19") and formatted only at
 * display time, so the admin panel can offer a plain date picker and every
 * screen — home, kiosk, TV, booth ticket — shows the same text. Years are
 * written in the Buddhist Era, which is what a school notice would use:
 * 2026 → 2569.
 *
 * Dates are parsed by hand rather than with `new Date()`. `new Date("2026-11-19")`
 * is midnight UTC, which in a timezone west of Greenwich is still the 18th, and
 * a booth date off by one is exactly the sort of bug that turns up on the day.
 */

const MONTHS_SHORT = [
  'ม.ค.',
  'ก.พ.',
  'มี.ค.',
  'เม.ย.',
  'พ.ค.',
  'มิ.ย.',
  'ก.ค.',
  'ส.ค.',
  'ก.ย.',
  'ต.ค.',
  'พ.ย.',
  'ธ.ค.',
] as const;

interface Ymd {
  y: number;
  m: number; // 1–12
  d: number;
}

/** Returns null for anything that is not a real calendar date. */
export function parseIsoDate(iso: string): Ymd | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return null;
  const [y, m, d] = [Number(match[1]), Number(match[2]), Number(match[3])];
  if (m < 1 || m > 12 || d < 1) return null;
  // Day-of-month check that respects month length and leap years.
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  if (d > daysInMonth) return null;
  return { y, m, d };
}

const be = (y: number) => y + 543;

const key = (t: Ymd) => t.y * 10000 + t.m * 100 + t.d;

/**
 * "19–20 พ.ย. 2569" · "19 พ.ย. 2569" · "30 พ.ย. – 2 ธ.ค. 2569" ·
 * "30 ธ.ค. 2569 – 2 ม.ค. 2570".
 *
 * Bad input never throws — a typo in the admin panel must not blank the home
 * page during a booth. An unreadable start returns an empty string; an end that
 * is unreadable or before the start collapses to a single day.
 */
export function formatDateRange(startIso: string, endIso: string): string {
  const start = parseIsoDate(startIso);
  if (!start) return '';
  const end = parseIsoDate(endIso);

  const one = `${start.d} ${MONTHS_SHORT[start.m - 1]} ${be(start.y)}`;
  if (!end || key(end) <= key(start)) return one;

  if (end.y === start.y && end.m === start.m) {
    return `${start.d}–${end.d} ${MONTHS_SHORT[start.m - 1]} ${be(start.y)}`;
  }
  if (end.y === start.y) {
    return `${start.d} ${MONTHS_SHORT[start.m - 1]} – ${end.d} ${MONTHS_SHORT[end.m - 1]} ${be(start.y)}`;
  }
  return `${one} – ${end.d} ${MONTHS_SHORT[end.m - 1]} ${be(end.y)}`;
}
