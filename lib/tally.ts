/**
 * Daily counts for the recap cards, for things that keep no row of their own: a
 * ระบาย chat is deleted when the student ends it, and the heart check-up saves no
 * session. Each count is only a Thailand day, a key and a number (lib/db.ts).
 *
 * Keys:
 *   vent:chats    a ระบาย conversation was started
 *   vent:replied  a พี่สภา answered a conversation for the first time
 *   vent:within3  ...and did so within 3 minutes of it starting
 *   checkup:topics  a check-up was finished with at least one topic picked
 *   topic:<label>   that topic was one of them (content/th/checkup.ts options)
 *
 * Counting never gets in the way: a failure is logged by name and forgotten.
 *
 * Imports are relative with `.ts` so scripts can load this in plain Node.
 */

import { db } from './db.ts';

const BANGKOK = 7 * 3_600_000;

/** The Thailand day, "YYYY-MM-DD", of an instant. */
export const tallyDay = (at: Date | string): string =>
  new Date((typeof at === 'string' ? Date.parse(at) : at.getTime()) + BANGKOK).toISOString().slice(0, 10);

/** Adds one to each key, on the Thailand day of `at`. */
export async function bump(keys: string[], at: Date | string = new Date()): Promise<void> {
  if (keys.length === 0) return;
  try {
    const c = await db();
    const day = tallyDay(at);
    await c.batch(
      keys.map((key) => ({
        sql: 'INSERT INTO tally (day, key, count) VALUES (?, ?, 1) ON CONFLICT (day, key) DO UPDATE SET count = count + 1',
        args: [day, key],
      })),
      'write',
    );
  } catch (error) {
    console.error('tally: failed', error instanceof Error ? error.name : 'unknown');
  }
}

/** Every count whose key starts with `prefix`, summed over `days`. */
export async function tallies(days: string[], prefix: string): Promise<Map<string, number>> {
  const out = new Map<string, number>();
  if (days.length === 0) return out;
  const c = await db();
  const r = await c.execute({
    sql: `SELECT key, SUM(count) AS n FROM tally
          WHERE day IN (${days.map(() => '?').join(', ')}) AND key LIKE ?
          GROUP BY key`,
    args: [...days, `${prefix}%`],
  });
  for (const row of r.rows) out.set(String(row.key), Number(row.n));
  return out;
}
