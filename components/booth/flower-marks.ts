import type { Tint } from '@/lib/types';

/**
 * The flower marks' inks and shape, apart from the drawing (./WallFlower) so that
 * server code (the TV's bars) can read them: a client component's module only
 * hands its exports to the server as references, never as values.
 */

/* Six pairings for six flowers. Only pink, blue and the festival accent exist in
   the palette, so the pairings are every ordered combination of two distinct
   inks — three outer inks × two inners. Swapping outer and inner changes which
   ink dominates and what colour the multiply blend makes, so they read as
   different flowers across a room even though nothing new is added. */
export const TINTS: { outer: string; inner: string }[] = [
  { outer: 'var(--accent)', inner: 'var(--riso-pink)' }, // yellow with pink centre
  { outer: 'var(--riso-pink)', inner: 'var(--riso-blue)' }, // pink with blue centre
  { outer: 'var(--riso-blue)', inner: 'var(--accent)' }, // blue with yellow centre
  { outer: 'var(--riso-pink)', inner: 'var(--accent)' }, // pink with yellow centre
  { outer: 'var(--accent)', inner: 'var(--riso-blue)' }, // yellow with blue centre
  { outer: 'var(--riso-blue)', inner: 'var(--riso-pink)' }, // blue with pink centre
];

/** The flower's main ink, for anything that should match it (e.g. a TV bar). */
export const tintInk = (tint: Tint) => TINTS[tint].outer;

/** Where the dotted ring sits, in the drawing's own units (its viewBox is 0 0 100 100). */
export const WALL_FLOWER_RING = { cx: 50, cy: 50, r: 44 } as const;
