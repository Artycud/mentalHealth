/**
 * How near a flower on the TV's river looks, by how recently it arrived.
 *
 * With every flower the same size the river turns into a crowd after five or six.
 * So the river has depth: the newest flower is the biggest and closest, and each
 * one before it is a little smaller, so the eye rests on the latest and the older
 * ones drift into the distance (ปล่อยวาง, letting go). Rank 0 is the newest.
 *
 * Returns a scale from 1 (nearest) down to MIN_DEPTH (furthest). A river of two or
 * three flowers barely tapers, so an early booth still looks generous.
 */
export const MIN_DEPTH = 0.42;
const STEP = 0.075;

export function riverDepth(rank: number): number {
  return Math.max(MIN_DEPTH, 1 - Math.max(0, rank) * STEP);
}
