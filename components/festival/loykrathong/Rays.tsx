import styles from './rays.module.css';

/** The rays: [angle in degrees, half-width in degrees, length as a share of the radius]. */
const RAYS: [number, number, number][] = [
  [0, 3.2, 1],
  [24, 1.6, 0.72],
  [47, 2.6, 0.92],
  [70, 1.4, 0.64],
  [95, 3, 0.96],
  [121, 1.8, 0.7],
  [146, 2.4, 0.88],
  [170, 1.4, 0.6],
  [193, 3.2, 1],
  [218, 1.6, 0.74],
  [242, 2.6, 0.9],
  [266, 1.4, 0.62],
  [290, 3, 0.94],
  [314, 1.8, 0.72],
  [338, 2.4, 0.86],
];

const rad = (deg: number) => (deg * Math.PI) / 180;

/** Each ray a thin wedge from the centre, drawn once. */
const WEDGES = RAYS.map(([at, half, len]) => {
  const r = 100 * len;
  const a = rad(at - half);
  const b = rad(at + half);
  return `M0 0 L${(Math.cos(a) * r).toFixed(1)} ${(Math.sin(a) * r).toFixed(1)} L${(Math.cos(b) * r).toFixed(1)} ${(Math.sin(b) * r).toFixed(1)} Z`;
}).join(' ');

/**
 * Moonlight: soft rays fanning out from the moon, fading with distance, turning
 * very slowly. It fills its parent, centred on it, and reaches well past it (see
 * rays.module.css). The drawing never changes; only its wrapper turns, a plain
 * transform with no filter or mask, so an old iPad just rotates a layer.
 *
 * `id` keeps the gradient's id unique when a page has more than one.
 */
export function MoonRays({ id }: { id: string }) {
  return (
    <span className={styles.rays} aria-hidden="true">
      <svg viewBox="-100 -100 200 200" className={styles.turn}>
        <defs>
          <radialGradient id={id} cx="0" cy="0" r="100" gradientUnits="userSpaceOnUse">
            <stop offset="0.18" stopColor="#fff3cf" stopOpacity="0.34" />
            <stop offset="0.5" stopColor="#ffe9b8" stopOpacity="0.12" />
            <stop offset="1" stopColor="#ffe9b8" stopOpacity="0" />
          </radialGradient>
        </defs>
        <path d={WEDGES} fill={`url(#${id})`} />
      </svg>
    </span>
  );
}
