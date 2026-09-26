/**
 * The maths behind the home's heart: where the finger is → a colour, a word, and
 * the shape of the blob. Pure functions, no DOM, so they are easy to reason about.
 *
 * Position is normalised: x 0 → 1 is energy (low → high), y 0 → 1 is light → heavy.
 */

type RGB = [number, number, number];

/** The four corners of the pad. Soft, not neon: each is a colour you would paint a wall. */
const CORNERS = {
  lightLow: [126, 224, 194] as RGB, // calm mint
  lightHigh: [255, 211, 107] as RGB, // sunny
  heavyLow: [132, 146, 255] as RGB, // blue-violet
  heavyHigh: [255, 128, 110] as RGB, // coral
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const mix = (a: RGB, b: RGB, t: number): RGB => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

export function moodColour(x: number, y: number): RGB {
  const top = mix(CORNERS.lightLow, CORNERS.lightHigh, x);
  const bottom = mix(CORNERS.heavyLow, CORNERS.heavyHigh, x);
  return mix(top, bottom, y);
}

export const rgb = ([r, g, b]: RGB) => `rgb(${Math.round(r)} ${Math.round(g)} ${Math.round(b)})`;

/** Which of the 3×3 feelings the point sits in. */
export function cell(x: number, y: number): { row: number; col: number } {
  const band = (v: number) => (v < 0.34 ? 0 : v < 0.67 ? 1 : 2);
  return { row: band(y), col: band(x) };
}

/** The idle loop: the colour drifts round the four corners until someone touches it. */
export function idlePoint(t: number): { x: number; y: number } {
  return { x: 0.5 + 0.34 * Math.cos(t * 0.25), y: 0.5 + 0.34 * Math.sin(t * 0.25) };
}

export interface BlobParams {
  /** 0 → 1 */
  energy: number;
  /** 0 = light, 1 = heavy */
  weight: number;
  /** seconds */
  t: number;
  /** extra scale, for breathing */
  scale: number;
  /** where the finger is pulling, in radians, and how hard (0 → 1) */
  pullAngle: number;
  pull: number;
}

const N = 10;
const PHASES = Array.from({ length: N }, (_, i) => i * 2.39996); // golden angle: no visible pattern

/**
 * A soft closed shape around 0,0. Energy makes it wobble faster and wider; weight
 * makes it wider, flatter and sit lower; a finger pulls the side nearest it.
 */
export function blobPath({ energy, weight, t, scale, pullAngle, pull }: BlobParams): string {
  const R = 92 * scale;
  const amp = 4 + energy * 13;
  const speed = 0.5 + energy * 1.8;
  const sx = 1 + weight * 0.14;
  const sy = 1.08 - weight * 0.2;
  const sink = weight * 30 - (1 - weight) * 18;

  const pts: [number, number][] = [];
  for (let i = 0; i < N; i += 1) {
    const a = (i / N) * Math.PI * 2;
    const wobble = Math.sin(t * speed + PHASES[i]) * amp + Math.sin(t * speed * 0.6 + PHASES[i] * 2) * amp * 0.4;
    const toward = Math.max(0, Math.cos(a - pullAngle)) ** 3 * pull * 26;
    const r = R + wobble + toward;
    pts.push([Math.cos(a) * r * sx, Math.sin(a) * r * sy + sink]);
  }

  // Closed Catmull-Rom through the points, as cubic Béziers.
  const p = (i: number) => pts[(i + N) % N];
  let d = `M${p(0)[0].toFixed(1)} ${p(0)[1].toFixed(1)}`;
  for (let i = 0; i < N; i += 1) {
    const [p0, p1, p2, p3] = [p(i - 1), p(i), p(i + 1), p(i + 2)];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return `${d} Z`;
}
