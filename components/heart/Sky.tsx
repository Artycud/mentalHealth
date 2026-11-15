import type { CSSProperties } from 'react';

import { SkyClock } from './SkyClock';
import styles from './Sky.module.css';

/**
 * The student pages' sky. It follows the time of day in Bangkok, the way the
 * greeting does: a peach morning with the sun low, a clear blue day with two
 * paper clouds drifting, a violet dusk, and a navy night with stars and a small
 * moon. Under it all, the school's roofline, its windows lit after dark.
 *
 * Which mood shows is `data-time` on <html> (lib/sky-time.ts), read by the CSS:
 * every mood is in the page, and only the one that is on is laid out and drawn.
 *
 * Built like the booth's sky: the stars come from a fixed seed (the server and
 * the browser draw the same ones) and are made once, when this file loads; the
 * only things that move are a twinkle (opacity) and the clouds (transform), so
 * the phone's GPU does all of it and the page itself does nothing per frame.
 */

/* The sky is drawn wide (a desktop's shape) and cut to the screen from the
   middle out (`slice`), so a phone sees the middle strip at the size it was made
   for, and a wide screen sees more of it rather than the same strip blown up. */
const W = 1600;
const H = 900;

function seeded(seed: number) {
  let s = seed;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

type Dot = { x: number; y: number; r: number; o: number };

/** Stars in three groups, each twinkling on its own clock. Mostly high up. */
const STARS: Dot[][] = (() => {
  const rnd = seeded(11);
  const groups: Dot[][] = [[], [], []];
  for (let i = 0; i < 300; i++) {
    const big = rnd() < 0.07;
    const y = rnd() ** 1.6 * H * 0.75;
    groups[i % 3].push({ x: rnd() * W, y, r: big ? 1.9 : 0.5 + rnd() * 0.8, o: 0.45 + rnd() * 0.55 });
  }
  return groups;
})();

const STAR_SVGS = STARS.map((group, i) => (
  <svg
    key={i}
    className={styles.stars}
    style={{ '--twinkle': `${4.2 + i * 1.6}s`, '--delay': `${-i * 1.7}s` } as CSSProperties}
    viewBox={`0 0 ${W} ${H}`}
    preserveAspectRatio="xMidYMin slice"
  >
    <g fill="#FFF6DC">
      {group.map((d, j) => (
        <circle key={j} cx={d.x.toFixed(1)} cy={d.y.toFixed(1)} r={d.r.toFixed(2)} opacity={d.o.toFixed(2)} />
      ))}
    </g>
  </svg>
));

/** A cloud cut from paper: a flat shape, no blur. */
const CLOUD = 'M14 40 C2 40 0 26 12 23 C10 10 28 6 34 15 C38 3 60 2 64 16 C76 10 88 20 82 30 C94 31 94 40 84 40 Z';

const CLOUDS = (
  <div className={styles.clouds}>
    <svg className={`${styles.cloud} ${styles.cloudA}`} viewBox="0 0 96 44">
      <path d={CLOUD} />
    </svg>
    <svg className={`${styles.cloud} ${styles.cloudB}`} viewBox="0 0 96 44">
      <path d={CLOUD} />
    </svg>
  </div>
);

/* The school's roofline: a hall with a pitched roof and a small clock tower, two
   blocks of classrooms, and trees. Windows are their own group, so the colour of
   their light is a CSS variable (lit at dusk and at night). */
const WINDOWS: [number, number][] = [];
for (const [x0, y0, cols, rows] of [
  [18, 74, 4, 3],
  [262, 66, 5, 4],
  [150, 86, 3, 2],
] as const) {
  for (let c = 0; c < cols; c++) for (let r = 0; r < rows; r++) WINDOWS.push([x0 + c * 14, y0 + r * 13]);
}
/* Not every room is lit: a fixed few stay dark. */
const LIT = WINDOWS.filter((_, i) => (i * 7) % 5 !== 0);

/** One stretch of the school, 400 wide. */
const SCHOOL = (
  <>
    <g className={styles.townFar}>
      <circle cx="120" cy="96" r="22" />
      <circle cx="140" cy="102" r="18" />
      <circle cx="380" cy="92" r="24" />
      <rect x="196" y="58" width="58" height="80" />
    </g>
    <g className={styles.townNear}>
      {/* classrooms, left */}
      <rect x="8" y="66" width="70" height="70" />
      <rect x="4" y="62" width="78" height="6" />
      {/* the hall, its roof and clock tower */}
      <path d="M140 78 L187 52 L234 78 Z" />
      <rect x="146" y="78" width="82" height="60" />
      <rect x="178" y="22" width="18" height="34" />
      <path d="M175 24 L187 10 L199 24 Z" />
      {/* classrooms, right */}
      <rect x="254" y="58" width="80" height="80" />
      <rect x="250" y="54" width="88" height="6" />
      {/* trees */}
      <circle cx="98" cy="106" r="20" />
      <rect x="96" y="110" width="4" height="26" />
      <circle cx="356" cy="104" r="22" />
      <circle cx="394" cy="112" r="16" />
      <rect x="-2" y="122" width="404" height="10" />
    </g>
    <g className={styles.windows}>
      {LIT.map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width="7" height="7" />
      ))}
      <circle cx="187" cy="38" r="5" />
    </g>
  </>
);

/* The roofline, 1600 wide: the school five times along it, every other one
   turned round so it never reads as a copy. The middle one's clock tower sits at
   the centre (x 800), which is the part a phone shows. */
const STRETCHES = [-187, 213, 613, 1013, 1413];

const TOWN = (
  <svg className={styles.town} viewBox="0 0 1600 130" preserveAspectRatio="xMidYMax slice">
    {STRETCHES.map((x, i) => (
      <g key={x} transform={i % 2 ? `translate(${x + 400} 0) scale(-1 1)` : `translate(${x} 0)`}>
        {SCHOOL}
      </g>
    ))}
  </svg>
);

/** `town`: the roofline along the foot. Left off where the screen's own controls
    live at the foot (the check-up, VENT), so they never sit on lit windows. */
export function Sky({ town = true }: { town?: boolean }) {
  return (
    <div className={town ? styles.sky : `${styles.sky} ${styles.bare}`} aria-hidden="true">
      {STAR_SVGS}
      <span className={styles.sun} />
      <span className={styles.moon} />
      {CLOUDS}
      {town && TOWN}
      <SkyClock />
    </div>
  );
}
