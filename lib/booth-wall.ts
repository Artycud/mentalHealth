import { loykrathongFlowers } from '../content/th/booth.ts';

import { db } from './db.ts';
import type { FestivalId, Tint } from './types';

/**
 * Live numbers for the booth TV, read from the sessions the kiosk (and students'
 * phones) have finished.
 *
 * Nothing here is per-student. The wall shows counts and anonymous flowers, in
 * keeping with BRIEF §12: there is no way to trace a flower to a person, and no
 * name, class or free text is ever stored or shown on a screen in a room full of
 * people.
 *
 * Relative imports with `.ts`, so scripts/test-db.mjs can load this in plain Node.
 */

export interface WallFlower {
  id: string;
  /** Thai display name. */
  name: string;
  /** Ink pairing for its mark, so the bar and the river agree. */
  tint: Tint;
  count: number;
}

export interface WallData {
  /** Booth results finished today (Thailand time). */
  today: number;
  /** Booth results finished across every booth day so far. */
  total: number;
  /** One per flower, in the content's order, counting today. */
  flowers: WallFlower[];
  /** The latest results, newest first: these are the flowers on the river. */
  recent: { tint: Tint }[];
  /** True only for the demo numbers, so the screen can say they are invented. */
  sample: boolean;
}

const DAY = 86_400_000;
const BANGKOK = 7 * 3_600_000;

/**
 * When "today" began, as a UTC timestamp. Thailand has no daylight saving and is
 * always UTC+7, so "today" is a fixed offset from UTC and never needs a timezone
 * database. Sessions are stored in UTC, so a booth session finished at 00:30 in
 * Bangkok belongs to the new day even though it is still the old day in UTC.
 */
export function bangkokDayStartUtc(nowMs: number): number {
  return Math.floor((nowMs + BANGKOK) / DAY) * DAY - BANGKOK;
}

const RIVER_LENGTH = 11;

const empty = (): WallData => ({
  today: 0,
  total: 0,
  flowers: loykrathongFlowers.map((f) => ({ id: f.id, name: f.name, tint: f.tint, count: 0 })),
  recent: [],
  sample: false,
});

/**
 * The wall for a festival. Never throws: if the database is unreachable the TV
 * shows zeros and keeps drifting, which is better than a blank screen in a room.
 */
export async function getWallData(festival: FestivalId, nowMs = Date.now()): Promise<WallData> {
  const data = empty();
  try {
    const c = await db();
    const dayStart = new Date(bangkokDayStartUtc(nowMs)).toISOString();
    const finished = "mode = 'booth' AND festival = ? AND completed_at IS NOT NULL";

    const total = await c.execute({ sql: `SELECT COUNT(*) AS n FROM session WHERE ${finished}`, args: [festival] });
    data.total = Number(total.rows[0].n);

    const byFlower = await c.execute({
      sql: `SELECT booth_result AS flower, COUNT(*) AS n FROM session
            WHERE ${finished} AND completed_at >= ? GROUP BY booth_result`,
      args: [festival, dayStart],
    });
    for (const row of byFlower.rows) {
      const slot = data.flowers.find((f) => f.id === row.flower);
      // A result naming a flower no longer on the list still happened; it just has
      // no bar. It is counted in today's total below.
      if (slot) slot.count = Number(row.n);
    }
    data.today = byFlower.rows.reduce((sum, r) => sum + Number(r.n), 0);

    const recent = await c.execute({
      sql: `SELECT booth_result AS flower FROM session WHERE ${finished}
            ORDER BY completed_at DESC LIMIT ?`,
      args: [festival, RIVER_LENGTH],
    });
    data.recent = recent.rows.flatMap((r) => {
      const f = loykrathongFlowers.find((x) => x.id === r.flower);
      return f ? [{ tint: f.tint }] : [];
    });
  } catch (error) {
    console.error('getWallData: showing an empty wall', error);
  }
  return data;
}

/**
 * Invented numbers, for reviewing the design before there is any real data.
 * Only ever reached with `?demo=1`, and only outside production (see the TV page).
 */
export function demoWallData(): WallData {
  const counts = [31, 26, 22, 19, 14, 9];
  return {
    today: counts.reduce((a, b) => a + b, 0),
    total: 213,
    flowers: loykrathongFlowers.map((f, i) => ({ id: f.id, name: f.name, tint: f.tint, count: counts[i] })),
    recent: Array.from({ length: RIVER_LENGTH }, (_, i) => ({
      tint: loykrathongFlowers[i % loykrathongFlowers.length].tint,
    })),
    sample: true,
  };
}
