import type { Tint } from '@/lib/types';

/**
 * A compact flower mark for the TV wall and the distribution bars.
 *
 * Same construction as the full marigold — overlapping petals, multiplied, a
 * dotted ring, three ink dots — reduced to a mark that stays legible at 60px
 * across a room. Tints are palette pairings only; no new colours (BRIEF §4).
 */

/* Six pairings for six flowers. Only pink, blue and the festival accent exist in
   the palette, so the pairings are every ordered combination of two distinct
   inks — three outer inks × two inners. Swapping outer and inner changes which
   ink dominates and what colour the multiply blend makes, so they read as
   different flowers across a room even though nothing new is added. */
const TINTS: { outer: string; inner: string }[] = [
  { outer: 'var(--accent)', inner: 'var(--riso-pink)' }, // yellow with pink centre
  { outer: 'var(--riso-pink)', inner: 'var(--riso-blue)' }, // pink with blue centre
  { outer: 'var(--riso-blue)', inner: 'var(--accent)' }, // blue with yellow centre
  { outer: 'var(--riso-pink)', inner: 'var(--accent)' }, // pink with yellow centre
  { outer: 'var(--accent)', inner: 'var(--riso-blue)' }, // yellow with blue centre
  { outer: 'var(--riso-blue)', inner: 'var(--riso-pink)' }, // blue with pink centre
];

/** The flower's main ink, for anything that should match it (e.g. a TV bar). */
export const tintInk = (tint: Tint) => TINTS[tint].outer;

/** 8 outer petals and 6 inner, on the same geometry as the full illustration. */
const OUTER = Array.from({ length: 8 }, (_, i) => {
  const a = (i / 8) * Math.PI * 2;
  return [50 + Math.cos(a) * 26, 50 + Math.sin(a) * 26] as const;
});

const INNER = Array.from({ length: 6 }, (_, i) => {
  const a = (i / 6) * Math.PI * 2 + 0.4;
  return [50 + Math.cos(a) * 14, 50 + Math.sin(a) * 14] as const;
});

export function WallFlower({ tint, size = 72 }: { tint: Tint; size?: number }) {
  const { outer, inner } = TINTS[tint];
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
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
      <circle cx="50" cy="50" r="44" className="ln-dot" />
      <path d="M46 48 L46.1 48 M52 53 L52.1 53 M54 45 L54.1 45" className="ln" />
    </svg>
  );
}
