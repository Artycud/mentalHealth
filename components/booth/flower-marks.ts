import type { Tint } from '@/lib/types';

/**
 * The flower marks' inks and shape, apart from the drawing (./WallFlower) so that
 * server code (the TV's bars) can read them: a client component's module only
 * hands its exports to the server as references, never as values.
 */

/* Six pairings for the six booth flowers, in the order of their `tint`
   (content/th/booth.ts): each flower's own real colour outside, a lighter or
   deeper one inside. The council's flowers come in colours the riso palette
   does not have (dark red, orange, purple), and on the TV across a room a flower
   should look like itself, so these are the flowers' colours, not the palette's. */
export const TINTS: { outer: string; inner: string }[] = [
  { outer: '#ffb511', inner: '#7a4a1e' }, // 0 sunflower: yellow, brown centre
  { outer: '#4b8be0', inner: '#a9c9f2' }, // 1 blue hydrangea
  { outer: '#8e1a30', inner: '#c23b52' }, // 2 dark-red rose
  { outer: '#ff7a1a', inner: '#ffc14d' }, // 3 orange gerbera
  { outer: '#8b5cc9', inner: '#c9aeee' }, // 4 purple lavender
  { outer: '#ff6fae', inner: '#ffc1da' }, // 5 pink tulip
];

/** Text that reads on the flower's main ink: white on the deep ones (blue, dark red, purple). */
export const tintText = (tint: Tint) => ([1, 2, 4].includes(tint) ? '#ffffff' : 'var(--ink)');

/** The flower's main ink, for anything that should match it (e.g. a TV bar). */
export const tintInk = (tint: Tint) => TINTS[tint].outer;

/** Where the dotted ring sits, in the drawing's own units (its viewBox is 0 0 100 100). */
export const WALL_FLOWER_RING = { cx: 50, cy: 50, r: 44 } as const;
