'use client';

import { useEffect, useMemo, useRef } from 'react';

import { HeartGlyph } from '@/components/heart/HeartGlyph';
import { useInView } from '@/components/heart/useInView';
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
  /** Relative size, 0.8 → 1.2. */
  size: 0.8 + rand(i, 3) * 0.4,
  phase: rand(i, 4) * 6.28,
  /** Its direction from the question: fixed, so it only ever moves in or out along it. */
  angle: (i / COUNT) * Math.PI * 2 + (rand(i, 5) - 0.5) * 0.25,
  /** How far out it starts, as a share of half the screen's diagonal. */
  far: 0.62 + rand(i, 6) * 0.3,
}));

/** Scattered hearts are this much bigger than gathered ones. */
const SPREAD = 1.35;

const clamp = (v: number) => Math.min(1, Math.max(0, v));
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
/** Visible between [a → b] fading in and [c → d] fading out. */
const windowed = (p: number, a: number, b: number, c: number, d: number) =>
  p <= a || p >= d ? 0 : p < b ? ease((p - a) / (b - a)) : p > c ? 1 - ease((p - c) / (d - c)) : 1;

/** How far a ray from the centre of a box, at `angle`, travels before it leaves the box. */
function toEdge(angle: number, halfW: number, halfH: number) {
  const c = Math.abs(Math.cos(angle));
  const s = Math.abs(Math.sin(angle));
  return Math.min(c > 1e-6 ? halfW / c : Infinity, s > 1e-6 ? halfH / s : Infinity);
}

/**
 * The home's one-page way in. The first screen is a quiet scene: one question,
 * everyone's hearts out at the edges. Scrolling a single page lifts the question
 * into the top half and gathers the hearts around it, while the check-up (the
 * next thing on the page, at its full size) rises into the lower half.
 *
 * Nothing ever overlaps, by construction rather than by tuning:
 *  - each heart only moves in or out along its own line from the question, and
 *    its closest point is a ring measured from the question's real size, so it
 *    can never cross the words;
 *  - the ring sits below the kicker and inside the top half, and the gathering
 *    is finished before the check-up rises into view;
 *  - no heart is ever over the kicker or the scroll cue.
 *
 * Cheap on a phone: sizes are measured once (and again on resize), the scene
 * is redrawn only when the scroll moves it, hearts move by transform alone, and
 * their slow wobble is a CSS animation the compositor runs by itself.
 */
export function IntroStory({ kicker, line, cue }: { kicker: string; line: readonly string[]; cue: string }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const shapes = useMemo(
    () => HEARTS.map((h) => blobPath({ energy: 0.25 + h.e * 0.3, weight: 0.2 + h.w * 0.3, t: h.phase * 3, scale: 1, pullAngle: 0, pull: 0 })),
    [],
  );
  // The hearts' sway pauses once the intro has scrolled away (data-live on the track).
  useInView(trackRef, '0px');

  useEffect(() => {
    const track = trackRef.current;
    const stage = stageRef.current;
    if (!track || !stage) return;
    const hearts = [...stage.querySelectorAll<HTMLElement>('[data-heart]')];
    const fades = [...stage.querySelectorAll<HTMLElement>('[data-at]')];
    const question = stage.querySelector<HTMLElement>('[data-question]')!;
    const kickerEl = stage.querySelector<HTMLElement>('[data-kicker]')!;
    const cueEl = stage.querySelector<HTMLElement>('[data-cue]')!;

    // ---- measured once, and again whenever the screen changes size ----
    const m = { W: 0, H: 0, r: 0, halfW: 0, halfH: 0, kickerBottom: 0, cueTop: 0, endY: 0, reach: 0, trackTop: 0, range: 1 };
    const gap = 10;
    const measure = () => {
      m.W = stage.clientWidth;
      m.H = stage.clientHeight;
      m.r = Math.min(26, m.W * 0.066); // a gathered heart's radius, before its own size
      const rMax = m.r * 1.2;
      m.halfW = question.offsetWidth / 2 + gap + rMax;
      m.halfH = question.offsetHeight / 2 + gap + rMax;
      m.kickerBottom = kickerEl.offsetTop + kickerEl.offsetHeight;
      m.cueTop = cueEl.offsetTop;
      // Where the question ends up: in the top half, with the ring's top row
      // clear of the kicker (and so its bottom row clear of the middle).
      m.endY = Math.max(m.H * 0.27, m.kickerBottom + gap + rMax + m.halfH);
      m.reach = Math.hypot(m.W, m.H) / 2;
      m.trackTop = track.getBoundingClientRect().top + window.scrollY;
      m.range = Math.max(1, track.offsetHeight - m.H);
      // Each heart's box is set once at its largest; scrolling only scales it.
      HEARTS.forEach((h, i) => {
        if (hearts[i]) hearts[i].style.width = `${(2 * m.r * h.size * SPREAD).toFixed(1)}px`;
      });
      lastP = -1;
      draw();
    };

    let lastP = -1;
    const draw = () => {
      const p = clamp((window.scrollY - m.trackTop) / m.range);
      if (p === lastP) return;
      lastP = p;
      const { W, H, r, halfW, halfH, kickerBottom, cueTop, endY, reach } = m;

      const rise = ease(clamp((p - 0.06) / 0.4));
      const cy = H / 2 + (endY - H / 2) * rise;
      question.style.transform = `translate3d(0, ${(cy - H / 2).toFixed(1)}px, 0)`;

      const gather = ease(clamp((p - 0.04) / 0.42));
      const shrink = (SPREAD - (SPREAD - 1) * gather) / SPREAD;

      HEARTS.forEach((h, i) => {
        const el = hearts[i];
        if (!el) return;
        const full = 2 * r * h.size * SPREAD;
        const size = full * shrink;
        const near = toEdge(h.angle, halfW, halfH);
        const dist = Math.max(near, reach * h.far * (1 - gather) + near * gather);
        const x = W / 2 + Math.cos(h.angle) * dist;
        let y = cy + Math.sin(h.angle) * dist;
        // Never over the kicker, nor over the cue while it is showing.
        y = Math.max(y, kickerBottom + gap + size / 2);
        if (p < 0.25) y = Math.min(y, cueTop - gap - size / 2);
        el.style.transform = `translate3d(${(x - full / 2).toFixed(1)}px, ${(y - full / 2).toFixed(1)}px, 0) scale(${shrink.toFixed(3)})`;
      });

      fades.forEach((el) => {
        const [a, b, c, d] = el.dataset.at!.split(',').map(Number);
        el.style.opacity = windowed(p, a, b, c, d).toFixed(3);
      });
    };

    let queued = 0;
    const onScroll = () => {
      if (queued) return;
      queued = requestAnimationFrame(() => {
        queued = 0;
        draw();
      });
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(stage);
    ro.observe(question);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      ro.disconnect();
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(queued);
    };
  }, []);

  return (
    <div ref={trackRef} className={styles.track}>
      <div ref={stageRef} className={styles.stage}>
        <div aria-hidden="true">
          {HEARTS.map((h, i) => (
            <div key={i} data-heart className={styles.heart}>
              <span className={styles.wobble} style={{ animationDelay: `${(-h.phase * 1.7).toFixed(2)}s` }}>
                <HeartGlyph d={shapes[i]} colour={rgb(moodColour(h.e, h.w))} className={styles.glyph} />
              </span>
            </div>
          ))}
        </div>

        <p className={styles.kicker} data-kicker>
          {kicker}
        </p>

        <h1 className={styles.line} data-question>
          {line.map((phrase) => (
            <span key={phrase}>{phrase}</span>
          ))}
        </h1>

        <p className={styles.cue} data-cue data-at="-1,-0.5,0.04,0.2" style={{ opacity: 1 }}>
          {cue}
          <span className={styles.cueLine} aria-hidden="true" />
        </p>
      </div>
    </div>
  );
}
