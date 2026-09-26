'use client';

import { useEffect, useMemo, useRef, type ReactNode } from 'react';

import { blobPath, moodColour, rgb } from '@/lib/heart';

import styles from './IntroStory.module.css';

/** Deterministic "random", so the server and the phone draw the same hearts. */
const rand = (i: number, k: number) => {
  const v = Math.sin(i * 127.1 + k * 311.7) * 43758.5453;
  return v - Math.floor(v);
};

const COUNT = 16;
const HEARTS = Array.from({ length: COUNT }, (_, i) => ({
  e: 0.06 + rand(i, 1) * 0.88,
  w: 0.06 + rand(i, 2) * 0.88,
  size: 0.7 + rand(i, 3) * 0.6,
  phase: rand(i, 4) * 6.28,
  /** Where it starts: out towards the edges of the screen. */
  angle: (i / COUNT) * Math.PI * 2 + rand(i, 5) * 0.5,
  far: 0.5 + rand(i, 6) * 0.3,
}));

const clamp = (v: number) => Math.min(1, Math.max(0, v));
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
/** Visible between [a → b] fading in and [c → d] fading out. */
const windowed = (p: number, a: number, b: number, c: number, d: number) =>
  p <= a || p >= d ? 0 : p < b ? ease((p - a) / (b - a)) : p > c ? 1 - ease((p - c) / (d - c)) : 1;

/**
 * The home's one-page way in. The first screen is a quiet scene: everyone's
 * hearts, scattered to the edges, and one question a friend would ask.
 * Scrolling down a single page swaps the question for `children` (the check-up's
 * panel) and gathers the hearts around it, so the invitation and the check-up
 * are one screen, in one visual language.
 *
 * Moved only by the scroll (and a slow wobble, which stops under reduced motion).
 */
export function IntroStory({
  kicker,
  line,
  cue,
  children,
}: {
  kicker: string;
  line: readonly string[];
  cue: string;
  children: ReactNode;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const shapes = useMemo(
    () => HEARTS.map((h) => blobPath({ energy: 0.25 + h.e * 0.3, weight: 0.2 + h.w * 0.3, t: h.phase * 3, scale: 1, pullAngle: 0, pull: 0 })),
    [],
  );

  useEffect(() => {
    const track = trackRef.current;
    const stage = stageRef.current;
    if (!track || !stage) return;
    const hearts = [...stage.querySelectorAll<HTMLElement>('[data-heart]')];
    const layers = [...stage.querySelectorAll<HTMLElement>('[data-at]')];
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const t0 = performance.now();
    let raf = 0;

    const draw = (now: number) => {
      const W = stage.clientWidth;
      const H = stage.clientHeight;
      const range = Math.max(1, track.offsetHeight - H);
      const p = clamp(-track.getBoundingClientRect().top / range);
      const t = reduce ? 0 : (now - t0) / 1000;
      const gather = ease(clamp((p - 0.05) / 0.75));
      // They gather into an oval that frames the panel, peeking out around it.
      const rx = Math.min(W * 0.54, 300);
      const ry = Math.min(H * 0.44, 380);
      const reach = Math.hypot(W, H) / 2;
      const unit = Math.min(W, H * 0.62) * 0.19;

      HEARTS.forEach((h, i) => {
        const el = hearts[i];
        if (!el) return;
        const a = h.angle + gather * 0.6 + Math.sin(t * 0.2 + h.phase) * 0.05;
        const far = reach * h.far;
        const size = unit * h.size * (1 - gather * 0.2);
        const x = W / 2 + Math.cos(a) * (far * (1 - gather) + rx * gather) - size / 2;
        const y = H / 2 + Math.sin(a) * (far * (1 - gather) + ry * gather) - size / 2 + Math.sin(t * 0.5 + h.phase * 2) * 4;
        el.style.width = `${size.toFixed(1)}px`;
        el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) rotate(${(Math.sin(t * 0.6 + h.phase) * 6).toFixed(1)}deg)`;
      });

      layers.forEach((el) => {
        const [a, b, c, d] = el.dataset.at!.split(',').map(Number);
        const o = windowed(p, a, b, c, d);
        el.style.opacity = o.toFixed(3);
        el.style.transform = `translateY(${((1 - o) * 12).toFixed(1)}px)`;
        el.style.pointerEvents = o > 0.6 ? 'auto' : 'none';
        el.style.visibility = o < 0.01 ? 'hidden' : 'visible';
      });
    };

    if (reduce) {
      const once = () => draw(performance.now());
      once();
      window.addEventListener('scroll', once, { passive: true });
      window.addEventListener('resize', once);
      return () => {
        window.removeEventListener('scroll', once);
        window.removeEventListener('resize', once);
      };
    }
    const tick = (now: number) => {
      draw(now);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div ref={trackRef} className={styles.track}>
      <div ref={stageRef} className={styles.stage}>
        <div aria-hidden="true">
          {HEARTS.map((h, i) => {
            const c = rgb(moodColour(h.e, h.w));
            return (
              <div key={i} data-heart className={styles.heart}>
                <svg viewBox="-160 -160 320 320">
                  <defs>
                    <radialGradient id={`intro-h${i}`} cx="38%" cy="32%" r="75%">
                      <stop offset="0%" style={{ stopColor: `color-mix(in oklab, ${c} 45%, #FFFFFF)` }} />
                      <stop offset="55%" style={{ stopColor: c }} />
                      <stop offset="100%" style={{ stopColor: `color-mix(in oklab, ${c} 75%, #8A3D63)` }} />
                    </radialGradient>
                  </defs>
                  <path d={shapes[i]} fill={`url(#intro-h${i})`} />
                </svg>
              </div>
            );
          })}
        </div>

        <p className={styles.kicker}>{kicker}</p>

        {/* The question, then, in its place, the check-up. */}
        <h1 className={styles.line} data-at="-1,-0.5,0.3,0.45" style={{ opacity: 1 }}>
          {line.map((phrase) => (
            <span key={phrase}>{phrase}</span>
          ))}
        </h1>
        <div className={styles.then} data-at="0.4,0.62,2,3">
          {children}
        </div>
        <p className={styles.cue} data-at="-1,-0.5,0.05,0.2" style={{ opacity: 1 }}>
          {cue}
          <span className={styles.cueLine} aria-hidden="true" />
        </p>
      </div>
    </div>
  );
}
