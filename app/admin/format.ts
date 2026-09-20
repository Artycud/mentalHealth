import { admin } from '@/content/th/admin';
import { formatDateRange } from '@/lib/thai-date';

/** "1 นาที 40 วิ" or "20 วิ". */
export function formatDuration(totalSeconds: number): string {
  if (totalSeconds < 60) return `${totalSeconds} วิ`;
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return s ? `${m} ${admin.summary.minutes} ${s} วิ` : `${m} ${admin.summary.minutes}`;
}

/** "19 พ.ย. 2569" for a Thailand day. */
export const fullDay = (day: string): string => formatDateRange(day, day);

/** "19 พ.ย." for a chart label. */
export const shortDay = (day: string): string => fullDay(day).split(' ').slice(0, 2).join(' ');

/** "19–20 พ.ย. 2569 · 11:00" for an instant, read on Thailand's clock. */
export function thaiStamp(iso: string): string {
  const t = new Date(Date.parse(iso) + 7 * 3_600_000).toISOString();
  return `${fullDay(t.slice(0, 10))} · ${t.slice(11, 16)}`;
}
