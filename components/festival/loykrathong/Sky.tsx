import Image from 'next/image';
import type { CSSProperties } from 'react';

import moonArt from './art/moon.webp';
import styles from './sky.module.css';

/**
 * The Loy Krathong night, as on the council's poster: glitter swept across the sky
 * in two ribbons, a scatter of stars that twinkle on their own clocks, and,
 * where a screen asks for them, the full moon in its light and lanterns (khom loi)
 * rising slowly off the water.
 *
 * It fills whatever it is put in, behind everything. Where the moon sits and which
 * part of the sky the lanterns use are the screen's to say, through CSS variables
 * on the wrapper (see sky.module.css), so the art never needs to know the layout.
 *
 * The scatter is drawn from a fixed seed, so the server and the browser draw the
 * same sky and every screen of the booth shares it.
 */

const W = 1600;
const H = 900;

/** A small fixed-seed generator: the same sky on every render. */
function seeded(seed: number) {
  let s = seed;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

/** The centre line of a ribbon at x. */
const ribbonY = (x: number, y0: number, amp: number, phase: number) =>
  y0 + amp * Math.sin((x / W) * Math.PI * 1.4 + phase);

const RIBBONS = [
  { y0: 120, amp: 60, phase: 0.4, thick: 150, dust: 420 },
  { y0: 470, amp: 50, phase: 2.6, thick: 120, dust: 280 },
];

type Dot = { x: number; y: number; r: number; o: number };

function makeSky() {
  const rnd = seeded(7);
  // Stars: three groups, each twinkling on its own clock (sky.module.css).
  const stars: Dot[][] = [[], [], []];
  for (let i = 0; i < 150; i++) {
    const big = rnd() < 0.08;
    stars[i % 3].push({
      x: rnd() * W,
      y: rnd() * H * 0.86,
      r: big ? 2.2 : 0.5 + rnd() * 1.1,
      o: 0.4 + rnd() * 0.6,
    });
  }
  // The ribbons: a soft band, and fine dust thick along its middle.
  const bands = RIBBONS.map(({ y0, amp, phase, thick }) => {
    const top: string[] = [];
    const bottom: string[] = [];
    for (let x = 0; x <= W; x += 40) {
      const y = ribbonY(x, y0, amp, phase);
      top.push(`${x} ${(y - thick / 2).toFixed(1)}`);
      bottom.unshift(`${x} ${(y + thick / 2).toFixed(1)}`);
    }
    return `M${top.join(' L')} L${bottom.join(' L')} Z`;
  });
  const dust: Dot[] = [];
  for (const { y0, amp, phase, thick, dust: n } of RIBBONS) {
    for (let i = 0; i < n; i++) {
      const x = rnd() * W;
      dust.push({
        x,
        y: ribbonY(x, y0, amp, phase) + (rnd() - 0.5) * thick * 0.8 * (0.4 + rnd()),
        r: 0.35 + rnd() * 0.7,
        o: 0.2 + rnd() * 0.5,
      });
    }
  }
  return { stars, bands, dust };
}

const SKY = makeSky();

/** Lanterns: where each rests in the screen's lantern zone (x 0–1 across it, y as a
 *  share of the sky's height), its size, and its own slow clock. */
const LANTERNS = [
  { x: 0.55, y: 0.07, s: 6, t: 46, d: -10 },
  { x: 0.82, y: 0.15, s: 4.2, t: 58, d: -30 },
  { x: 0.68, y: 0.3, s: 3.2, t: 52, d: -5 },
  { x: 0.95, y: 0.05, s: 2.6, t: 64, d: -40 },
  { x: 0.36, y: 0.36, s: 2.4, t: 50, d: -22 },
  { x: 0.12, y: 0.46, s: 1.8, t: 70, d: -55 },
  { x: 0.9, y: 0.4, s: 2, t: 60, d: -12 },
];

const dots = (list: Dot[]) =>
  list.map((d, i) => <circle key={i} cx={d.x.toFixed(1)} cy={d.y.toFixed(1)} r={d.r.toFixed(2)} opacity={d.o.toFixed(2)} />);

export function LoyKrathongSky({ moon = false, lanterns = false }: { moon?: boolean; lanterns?: boolean }) {
  return (
    <div className={styles.sky} aria-hidden="true">
      <svg className={`${styles.layer} ${styles.ribbons}`} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="lk-ribbon" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#9fb6e6" stopOpacity="0" />
            <stop offset="0.5" stopColor="#9fb6e6" stopOpacity="0.13" />
            <stop offset="1" stopColor="#9fb6e6" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="lk-lantern" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fffbe4" />
            <stop offset="0.55" stopColor="#fbe2a0" />
            <stop offset="1" stopColor="#f0a04a" />
          </linearGradient>
        </defs>
        {SKY.bands.map((d) => (
          <path key={d} d={d} fill="url(#lk-ribbon)" />
        ))}
        <g fill="#fff6dc">{dots(SKY.dust)}</g>
      </svg>

      {SKY.stars.map((group, i) => (
        <svg
          key={i}
          className={`${styles.layer} ${styles.stars}`}
          style={{ '--twinkle': `${4.5 + i * 1.7}s`, '--twinkle-delay': `${-i * 1.9}s` } as CSSProperties}
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="xMidYMid slice"
        >
          <g fill="#fff6dc">{dots(group)}</g>
        </svg>
      ))}

      {moon && (
        <div className={styles.moon}>
          <span className={styles.moonGlow} />
          <Image src={moonArt} alt="" sizes="30vh" loading="eager" className={styles.moonArt} />
        </div>
      )}

      {lanterns && (
        <div className={styles.lanterns}>
          {LANTERNS.map((l) => (
            <span
              key={`${l.x}-${l.y}`}
              className={styles.lantern}
              style={
                {
                  '--x': l.x,
                  '--y': `${l.y * 100}%`,
                  '--s': `${l.s}vh`,
                  '--t': `${l.t}s`,
                  '--d': `${l.d}s`,
                } as CSSProperties
              }
            >
              <svg viewBox="-12 -16 24 32">
                <path d="M-9 -13 Q0 -16.5 9 -13 Q11.5 0 7 12.5 Q0 14.5 -7 12.5 Q-11.5 0 -9 -13Z" fill="url(#lk-lantern)" />
                <ellipse cx="0" cy="12.6" rx="6" ry="1.6" fill="#d9772c" />
              </svg>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
