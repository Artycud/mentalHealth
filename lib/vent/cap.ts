/**
 * A ceiling on VENT calls across everyone, because each one may cost an AI
 * request. Like the session cap (lib/session.ts), it is counted in the database,
 * not in memory, and it counts per minute only: no person, address or text.
 */

import { db } from '../db.ts';

export const VENT_CAP_PER_MINUTE = 60;

/** Count this call; false when the minute's ceiling is already reached. */
export async function takeVentSlot(now = new Date()): Promise<boolean> {
  const c = await db();
  const minute = now.toISOString().slice(0, 16); // YYYY-MM-DDTHH:MM, UTC
  const row = await c.execute({
    sql: `INSERT INTO vent_tick (minute, count) VALUES (?, 1)
          ON CONFLICT (minute) DO UPDATE SET count = count + 1
          RETURNING count`,
    args: [minute],
  });
  // Old minutes are of no use to anyone; keep the table to the last hour.
  const hourAgo = new Date(now.getTime() - 3_600_000).toISOString().slice(0, 16);
  await c.execute({ sql: 'DELETE FROM vent_tick WHERE minute < ?', args: [hourAgo] });
  return Number(row.rows[0].count) <= VENT_CAP_PER_MINUTE;
}
