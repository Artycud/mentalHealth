import type { Tint } from './types';

/**
 * Which results on the TV are NEW since it last looked.
 *
 * The TV polls (components/booth/AutoRefresh.tsx), so it never hears "a flower
 * was added"; it only sees the total go up. This turns that into the flowers to
 * celebrate. It is a pure function so the awkward cases are testable in plain
 * Node, and they are the point:
 *  - the very first look is never new: reloading the TV must not replay the day;
 *  - a total that goes DOWN (an admin deleted sessions) celebrates nothing;
 *  - a burst of arrivals is capped, so a busy minute cannot leave the screen
 *    stuck showing a backlog for a long time afterwards.
 *
 * Relative imports, so scripts/test-new-flowers.mjs can load this in plain Node.
 */

export interface Arrival {
  flowerId: string;
  /** Thai display name, ready to show. */
  name: string;
  tint: Tint;
}

/** Never celebrate more than this many at once. */
export const MAX_QUEUED = 3;

/**
 * @param previousTotal what the total was when we last looked; `null` on the very
 *                      first look.
 * @param total         what it is now.
 * @param recent        the latest results, NEWEST FIRST.
 * @returns the arrivals to celebrate, OLDEST FIRST, so they play in the order they
 *          happened.
 */
export function newArrivals(
  previousTotal: number | null,
  total: number,
  recent: Arrival[],
  cap: number = MAX_QUEUED,
): Arrival[] {
  if (previousTotal === null || total <= previousTotal) return [];
  // The latest few, not the earliest few: if ten arrived, the room wants to see
  // what just happened, and `recent` may hold fewer than the difference anyway.
  const count = Math.min(total - previousTotal, recent.length, cap);
  return recent.slice(0, count).reverse();
}
