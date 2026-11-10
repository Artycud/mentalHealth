import { loykrathongFlowers, okayQuestion } from '../content/th/booth.ts';

import { db } from './db.ts';
import type { Arrival } from './new-flowers.ts';
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
  /**
   * The latest results, newest first: the flowers on the river, and where the
   * TV finds the new ones to celebrate. A flower's own id and name only (they are
   * public), never anything about who got it.
   */
  recent: Arrival[];
  /**
   * How many in ten of today's players answered the honest question with "บอกว่า
   * โอเค แต่จริง ๆ ไม่ค่อย", or null while it may not be shown. See okayShare.
   */
  okay: OkayShare | null;
  /** True only for the demo numbers, so the screen can say they are invented. */
  sample: boolean;
}

export interface OkayShare {
  /** Rounded to a whole "n in 10", never a precise percentage. */
  inTen: number;
  /** How many answers it is drawn from (for the admin and tests, not the screen). */
  answered: number;
}

/**
 * The TV's privacy guard for the honest question (BRIEF §12). The TV is a screen in
 * a room, beside the one iPad, so a number that moved the moment a student walked
 * away from the iPad would say what that student answered. So:
 *  - the newest OKAY_SKIP_NEWEST results of the day are always left out, so the
 *    number can only move several students later, never right after someone;
 *  - nothing is shown until OKAY_MIN answers remain after that;
 *  - it is rounded to a whole "n in 10".
 */
export const OKAY_SKIP_NEWEST = 5;
export const OKAY_MIN = 10;

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
  okay: null,
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
      return f ? [{ flowerId: f.id, name: f.name, tint: f.tint }] : [];
    });

    // The honest question, behind its guard (OKAY_SKIP_NEWEST, OKAY_MIN). "LIMIT -1
    // OFFSET n" is SQLite for "all but the first n".
    const okay = await c.execute({
      sql: `SELECT a.choice_id AS choice, COUNT(*) AS n
            FROM answer a
            JOIN (SELECT id FROM session WHERE ${finished} AND completed_at >= ?
                  ORDER BY completed_at DESC LIMIT -1 OFFSET ?) s ON s.id = a.session_id
            WHERE a.question_id = ?
            GROUP BY a.choice_id`,
      args: [festival, dayStart, OKAY_SKIP_NEWEST, okayQuestion.id],
    });
    data.okay = okayShare(okay.rows.map((r) => ({ choice: String(r.choice), n: Number(r.n) })));
  } catch (error) {
    console.error('getWallData: showing an empty wall', error);
  }
  return data;
}

/** The guarded share from the counts per choice: null until there are OKAY_MIN. */
export function okayShare(counts: { choice: string; n: number }[]): OkayShare | null {
  const answered = counts.reduce((sum, r) => sum + r.n, 0);
  if (answered < OKAY_MIN) return null;
  const hide = counts.find((r) => r.choice === 'hide')?.n ?? 0;
  return { inTen: Math.round((hide / answered) * 10), answered };
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
    recent: Array.from({ length: RIVER_LENGTH }, (_, i) => {
      const f = loykrathongFlowers[i % loykrathongFlowers.length];
      return { flowerId: f.id, name: f.name, tint: f.tint };
    }),
    okay: { inTen: 4, answered: 96 },
    sample: true,
  };
}
