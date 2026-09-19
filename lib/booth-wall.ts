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

const TINTS = [0, 1, 2, 3] as const;

export interface WallFlower {
  id: string;
  /** Thai display name. */
  name: string;
  /** Palette pairing for the mark. Index into the display's tint list. */
  tint: 0 | 1 | 2 | 3;
  count: number;
}

export interface WallData {
  /** Sessions completed at the booth today. */
  today: number;
  /** Running total across every booth day so far. */
  total: number;
  flowers: WallFlower[];
  /** Most recent results, newest first — these are the ones floating. */
  recent: { id: string; tint: 0 | 1 | 2 | 3 }[];
  /** True while the numbers are invented, so the screen can say so. */
  sample: boolean;
}

/**
 * Flower slots.
 *
 * Only ดาวเรือง is written (BRIEF §8). The other three are named by the council
 * once they know what the booth can actually hand out, so they stay clearly
 * labelled placeholders rather than invented species. The tints are palette
 * pairings, not new colours.
 */
const FLOWER_SLOTS: Omit<WallFlower, 'count'>[] = loykrathongFlowers.map((f, i) => ({
  id: f.id,
  name: f.name,
  tint: TINTS[i],
}));

export function getWallData(): WallData {
  // TODO(phase 4): read from lib/db.ts —
  //   SELECT booth_result, COUNT(*) FROM session
  //   WHERE mode = 'booth' AND festival = ? AND completed_at IS NOT NULL
  const counts = [31, 24, 18, 14];

  const flowers = FLOWER_SLOTS.map((slot, i) => ({ ...slot, count: counts[i] }));

  // A deterministic spread, so the sample screen does not reshuffle on every
  // render and make the layout hard to judge.
  const recent = Array.from({ length: 11 }, (_, i) => ({
    id: `sample-${i}`,
    tint: FLOWER_SLOTS[i % 4].tint,
  }));

  return {
    today: counts.reduce((a, b) => a + b, 0),
    total: 213,
    flowers,
    recent,
    sample: true,
  };
}
