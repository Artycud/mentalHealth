import { db } from './db.ts';
import type { ActiveFestival } from './types';

/**
 * The one setting that matters so far: which festival's booth is live (BRIEF §3).
 * Read on every student page load, and written only by the admin panel (phase 5).
 *
 * Relative imports with `.ts`, so scripts/test-db.mjs can load this in plain Node.
 */

const FESTIVALS = ['loykrathong', 'christmas', 'cny-valentine'];

/** What is live before anyone has touched the admin panel. */
export const DEFAULT_ACTIVE: ActiveFestival = 'loykrathong';

export function isActiveFestival(value: unknown): value is ActiveFestival {
  return value === 'none' || (typeof value === 'string' && FESTIVALS.includes(value));
}

/**
 * Which festival is live. Never throws: if the database is unreachable the student
 * pages fall back to the default and carry on. A student must never see an error
 * because of what is, from their side, bookkeeping (BRIEF §3).
 */
export async function getActiveFestival(): Promise<ActiveFestival> {
  try {
    const c = await db();
    const r = await c.execute("SELECT value FROM setting WHERE key = 'active_festival'");
    const value = r.rows[0]?.value;
    return isActiveFestival(value) ? value : DEFAULT_ACTIVE;
  } catch (error) {
    console.error('getActiveFestival: falling back to the default', error);
    return DEFAULT_ACTIVE;
  }
}

/** For the admin panel's theme control (phase 5). Past sessions are untouched. */
export async function setActiveFestival(festival: ActiveFestival): Promise<void> {
  if (!isActiveFestival(festival)) throw new Error(`not a festival: ${String(festival)}`);
  const c = await db();
  await c.execute({
    sql: `INSERT INTO setting (key, value, updated_at) VALUES ('active_festival', ?, ?)
          ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    args: [festival, new Date().toISOString()],
  });
}

/**
 * Whether the booth's reward (the Loy Krathong ice-cream coupon) is still being
 * given out. The TV leads with it and the kiosk mentions it, so when the coupons run
 * out an admin switches this off and neither screen promises one any more.
 *
 * On by default: a fresh database, or one nobody has touched, shows the reward. It
 * never throws; if the database is unreachable the screens carry on as if it were on.
 */
export async function getRewardOn(): Promise<boolean> {
  try {
    const c = await db();
    const r = await c.execute("SELECT value FROM setting WHERE key = 'reward_on'");
    const value = r.rows[0]?.value;
    return value !== '0';
  } catch (error) {
    console.error('getRewardOn: falling back to on', error);
    return true;
  }
}

/** For the admin panel's coupon switch. */
export async function setRewardOn(on: boolean): Promise<void> {
  const c = await db();
  await c.execute({
    sql: `INSERT INTO setting (key, value, updated_at) VALUES ('reward_on', ?, ?)
          ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    args: [on ? '1' : '0', new Date().toISOString()],
  });
}
