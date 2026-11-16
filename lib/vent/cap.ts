/**
 * Ceilings on ระบาย across everyone, so it cannot be flooded: messages per minute,
 * and (much lower) chat-code lookups per minute, which is what makes guessing
 * someone's code hopeless (31^8 codes at 20 tries a minute). Like the session
 * cap (lib/session.ts), counted in the database, not in memory, and per minute
 * only: no person, address or text.
 */

import { db } from '../db.ts';

export const VENT_CAP_PER_MINUTE = 60;
export const CODE_CAP_PER_MINUTE = 20;
/** Check-up topic counts (app/api/checkup), so nobody can stuff the recap. */
export const TALLY_CAP_PER_MINUTE = 60;

/** Count this call; false when the minute's ceiling is already reached. */
export async function takeVentSlot(now = new Date(), kind: 'message' | 'code' | 'tally' = 'message'): Promise<boolean> {
  const c = await db();
  // YYYY-MM-DDTHH:MM, UTC; code lookups get their own count beside it (it still sorts by minute).
  const minute = now.toISOString().slice(0, 16) + (kind === 'message' ? '' : `#${kind}`);
  const row = await c.execute({
    sql: `INSERT INTO vent_tick (minute, count) VALUES (?, 1)
          ON CONFLICT (minute) DO UPDATE SET count = count + 1
          RETURNING count`,
    args: [minute],
  });
  // Old minutes are of no use to anyone; keep the table to the last hour.
  const hourAgo = new Date(now.getTime() - 3_600_000).toISOString().slice(0, 16);
  await c.execute({ sql: 'DELETE FROM vent_tick WHERE minute < ?', args: [hourAgo] });
  const cap = kind === 'code' ? CODE_CAP_PER_MINUTE : kind === 'tally' ? TALLY_CAP_PER_MINUTE : VENT_CAP_PER_MINUTE;
  return Number(row.rows[0].count) <= cap;
}
