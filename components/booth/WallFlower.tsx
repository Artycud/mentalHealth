'use client';

import type { Tint } from '@/lib/types';

import { TINTS, WALL_FLOWER_RING } from './flower-marks';

/**
 * A compact flower mark for the TV wall and the distribution bars.
 *
 * Same construction as the full marigold — overlapping petals, multiplied, a
 * dotted ring, three ink dots — reduced to a mark that stays legible at 60px
 * across a room. Tints are palette pairings only; no new colours (BRIEF §4).
 *
 * A client component: the TV draws a couple of dozen of these and refreshes every
 * few seconds, and as a client component each one travels in that refresh as just
 * its tint, not as its sixteen circles. (Not memo(): see festival/loykrathong/Sky.tsx.)
 * Its tints live in ./flower-marks, where server code can read them too.
 */

/** 8 outer petals and 6 inner, on the same geometry as the full illustration. */
const OUTER = Array.from({ length: 8 }, (_, i) => {
  const a = (i / 8) * Math.PI * 2;
  return [50 + Math.cos(a) * 26, 50 + Math.sin(a) * 26] as const;
});

const INNER = Array.from({ length: 6 }, (_, i) => {
  const a = (i / 6) * Math.PI * 2 + 0.4;
  return [50 + Math.cos(a) * 14, 50 + Math.sin(a) * 14] as const;
});

/**
 * `plate` sets the flower on a small disc of cream paper, like a krathong: the
 * petals still multiply, but onto the plate, so the flower keeps its own colours on
 * any water and reads as a lit thing floating, however dark the scene behind it.
 *
 * `ring={false}` leaves out the dotted ring, for a screen that draws it on its own
 * so it can turn (components/booth/FlowerArt).
 */
export function WallFlower({
  tint,
  size = 72,
  plate = false,
  ring = true,
}: {
  tint: Tint;
  size?: number;
  plate?: boolean;
  ring?: boolean;
}) {
  const { outer, inner } = TINTS[tint];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      aria-hidden="true"
      style={plate ? { isolation: 'isolate' } : undefined}
    >
      {plate && <circle cx="50" cy="50" r="47" fill="var(--paper-raised)" />}
      {OUTER.map(([cx, cy]) => (
        <circle key={`o${cx}${cy}`} cx={cx} cy={cy} r="17" fill={outer} className="mul" />
      ))}
      {INNER.map(([cx, cy]) => (
        <circle
          key={`i${cx}${cy}`}
          cx={cx}
          cy={cy}
          r="14"
          fill={inner}
          opacity="0.55"
          className="mul"
        />
      ))}
      {ring && (
        <circle
          cx={WALL_FLOWER_RING.cx}
          cy={WALL_FLOWER_RING.cy}
          r={WALL_FLOWER_RING.r}
          className="ln-dot"
          opacity={plate ? 0.5 : 1}
        />
      )}
      <path d="M46 48 L46.1 48 M52 53 L52.1 53 M54 45 L54.1 45" className="ln" />
    </svg>
  );
}
