/**
 * Live data for the booth TV display.
 *
 * PHASE 2 STUB. Returns sample rows so the TV layout can be designed and
 * reviewed before persistence exists. Phase 4 replaces the body of
 * `getWallData` with a read through lib/db.ts — the shape stays the same, so
 * nothing in the display component changes.
 *
 * The TV and the kiosk are two separate devices, so this genuinely needs shared
 * server state: the kiosk writes a session, the TV reads it back. That is why
 * real numbers cannot appear until phase 4.
 *
 * Nothing here is per-student. The wall shows counts and anonymous flowers, in
 * keeping with BRIEF §12 — there is no way to trace a flower to a person, and
 * no name, class or free text is ever stored or shown on a screen in a room
 * full of people.
 */

import { loykrathongFlowers } from '@/content/th/booth';
import type { Tint } from '@/lib/types';


export interface WallFlower {
  id: string;
  /** Thai display name. */
  name: string;
  /** Palette pairing for the mark. Index into the display's tint list. */
  tint: Tint;
  count: number;
}

export interface WallData {
  /** Sessions completed at the booth today. */
  today: number;
  /** Running total across every booth day so far. */
  total: number;
  flowers: WallFlower[];
  /** Most recent results, newest first — these are the ones floating. */
  recent: { id: string; tint: Tint }[];
  /** True while the numbers are invented, so the screen can say so. */
  sample: boolean;
}

/**
 * One slot per flower the booth stocks, derived from the content file so a
 * renamed, added or dropped flower needs no change here. The tints are palette
 * pairings, not new colours.
 */
const FLOWER_SLOTS: Omit<WallFlower, 'count'>[] = loykrathongFlowers.map((f) => ({
  id: f.id,
  name: f.name,
  tint: f.tint,
}));

export function getWallData(): WallData {
  // TODO(phase 4): read from lib/db.ts —
  //   SELECT booth_result, COUNT(*) FROM session
  //   WHERE mode = 'booth' AND festival = ? AND completed_at IS NOT NULL
  // Sample only. Deliberately uneven so the bars read as a chart, but every
  // flower has a count — the real spread is close to even (see the scoring
  // note in content/th/booth.ts), so expect flatter bars at the real booth.
  const counts = [31, 26, 22, 19, 14, 9];

  const flowers = FLOWER_SLOTS.map((slot, i) => ({ ...slot, count: counts[i] }));

  // A deterministic spread, so the sample screen does not reshuffle on every
  // render and make the layout hard to judge.
  const recent = Array.from({ length: 11 }, (_, i) => ({
    id: `sample-${i}`,
    tint: FLOWER_SLOTS[i % FLOWER_SLOTS.length].tint,
  }));

  return {
    today: counts.reduce((a, b) => a + b, 0),
    total: 213,
    flowers,
    recent,
    sample: true,
  };
}
