import { SpeckleDefs } from '@/components/illustrations/paper';

import styles from './river.module.css';

/**
 * The night river of Loy Krathong: two layers of cut-paper water that drift at
 * different speeds, a moon sitting on the horizon, and its broken reflection.
 * Fills whatever band it is put in; the results (the floating flowers) are drawn
 * on top of it by the TV, and know nothing about it.
 *
 * Each layer is drawn two periods wide and slid by exactly one, so it loops without
 * a seam. A period is 1920 units and holds a whole number of cycles of each sine
 * below, which is what makes it repeat.
 */

const PERIOD = 1920;

/** A hand-cut water edge: two waves of different length added together, then filled below. */
function edge(base: number, big: [number, number], small: [number, number], phase: number): string {
  const points: string[] = [];
  for (let x = 0; x <= PERIOD * 2; x += 16) {
    const t = (x / PERIOD) * Math.PI * 2;
    const y = base + big[0] * Math.sin(big[1] * t + phase) + small[0] * Math.sin(small[1] * t + phase * 2.3);
    points.push(`${x} ${y.toFixed(1)}`);
  }
  return `M${points.join(' L')} L${PERIOD * 2} 324 L0 324 Z`;
}

const FAR = edge(56, [9, 4], [4, 9], 0.6);
const NEAR = edge(124, [11, 5], [5, 11], 2.1);

/** Fine highlights on the water, one set per period. */
const GLINTS = [
  [40, 176], [420, 214], [900, 168], [1180, 226], [1500, 190], [700, 250],
  [1960, 176], [2340, 214], [2820, 168], [3100, 226], [3420, 190], [2620, 250],
] as const;

export function LoyKrathongRiver({ moon = true }: { moon?: boolean }) {
  return (
    <div className={styles.scene} aria-hidden="true">
      {moon && (
        <div className={styles.moon}>
          <svg viewBox="-150 -150 300 300">
            <defs>
              <radialGradient id="lk-moon-glow">
                <stop offset="0" stopColor="var(--fest-light)" stopOpacity="0.4" />
                <stop offset="1" stopColor="var(--fest-light)" stopOpacity="0" />
              </radialGradient>
            </defs>
            <SpeckleDefs id="lk-moon-speckle" size={110} />
            <circle r="150" fill="url(#lk-moon-glow)" />
            <circle r="65" fill="var(--fest-light)" />
            <circle r="65" fill="url(#lk-moon-speckle)" />
          </svg>
        </div>
      )}

      <div className={`${styles.layer} ${styles.far}`}>
        <svg viewBox={`0 0 ${PERIOD * 2} 324`} preserveAspectRatio="none">
          <SpeckleDefs id="lk-far-speckle" size={110} />
          <path d={FAR} fill="var(--fest-far)" />
          <path d={FAR} fill="url(#lk-far-speckle)" />
        </svg>
      </div>

      <div className={`${styles.layer} ${styles.near}`}>
        <svg viewBox={`0 0 ${PERIOD * 2} 324`} preserveAspectRatio="none">
          <SpeckleDefs id="lk-near-speckle" size={110} />
          <path d={NEAR} fill="var(--fest-near)" />
          <path d={NEAR} fill="url(#lk-near-speckle)" />
          <g fill="none" stroke="var(--fest-on-water)" strokeLinecap="round" strokeWidth="2" opacity="0.2">
            {GLINTS.map(([x, y]) => (
              <path key={`${x}-${y}`} d={`M${x} ${y} q60 -10 120 0 t120 0`} vectorEffect="non-scaling-stroke" />
            ))}
          </g>
        </svg>
      </div>

      {moon && (
        <div className={styles.reflection}>
          <span /> <span /> <span /> <span /> <span />
        </div>
      )}
    </div>
  );
}
