'use client';

import { useEffect, useMemo, useRef, type ReactNode } from 'react';

import { HeartGlyph } from '@/components/heart/HeartGlyph';
import { useInView } from '@/components/heart/useInView';
import { prefersReducedMotion } from '@/lib/frame';
import { blobPath, moodColour, rgb } from '@/lib/heart';
import { INTRO_SEEN_KEY } from '@/lib/sky-time';

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
/** How long the question is shown on its own before the home comes in. */
const HOLD = 900;
const GAP = 10;

/** How far a ray from the centre of a box, at `angle`, travels before it leaves the box. */
function toEdge(angle: number, halfW: number, halfH: number) {
  const c = Math.abs(Math.cos(angle));
  const s = Math.abs(Math.sin(angle));
  return Math.min(c > 1e-6 ? halfW / c : Infinity, s > 1e-6 ? halfH / s : Infinity);
}

/** The phase lives on <html> (see IntroStory.module.css): 'done' once the home is in. */
const isDone = () => document.documentElement.dataset.intro === 'done';

/**
 * The top of the home. It opens as one quiet scene, the question alone in the
 * middle of the sky with everyone's hearts out at the edges; a moment later it
 * glides into the home by itself: the question rises to be the headline, the
 * hearts gather around it, and the three ways in (`children`: the check-up, VENT,
 * CUD Care) come up under it. No scrolling asked for, and none forced.
 *
 * The two scenes are one layout in two states (`data-intro` on <html>), and the
 * glide between them moves only transforms (a FLIP, below), so the GPU does it
 * and the page does no work per frame. Any touch, scroll or key during the
 * pause switches at once; with reduced motion it simply switches. It plays once
 * a visit: the script in <head> (lib/sky-time.ts) starts a return visit on the
 * home.
 *
 * Nothing overlaps, by construction: each heart only moves in or out along its
 * own line from the question, and its closest point is a ring measured from the
 * question's real size; the space for that ring is kept above and below the
 * question in the layout (IntroStory.module.css .question).
 */
export function IntroStory({ kicker, line, children }: { kicker: string; line: readonly string[]; children: ReactNode }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const shapes = useMemo(
    () => HEARTS.map((h) => blobPath({ energy: 0.25 + h.e * 0.3, weight: 0.2 + h.w * 0.3, t: h.phase * 3, scale: 1, pullAngle: 0, pull: 0 })),
    [],
  );
  // The hearts' sway pauses once the top has scrolled away (data-live).
  useInView(rootRef, '0px');

  // ---- where each heart is, scattered and gathered: measured, written once ----
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const hearts = [...root.querySelectorAll<HTMLElement>('[data-heart]')];
    const question = root.querySelector<HTMLElement>('[data-question]')!;
    const kickerEl = root.querySelector<HTMLElement>('[data-kicker]')!;

    const place = () => {
      const W = root.clientWidth;
      const H = window.innerHeight;
      const r = Math.min(26, W * 0.066); // a gathered heart's radius, before its own size
      const rMax = r * 1.2;
      const halfW = question.offsetWidth / 2 + GAP + rMax;
      const halfH = question.offsetHeight / 2 + GAP + rMax;
      // In the opening scene the question is in the middle of the screen: keep
      // hearts below the kicker and on the screen.
      const top = kickerEl.offsetTop + kickerEl.offsetHeight + GAP - H / 2;
      const reach = Math.hypot(W, H) / 2;
      HEARTS.forEach((h, i) => {
        const el = hearts[i];
        if (!el) return;
        const full = 2 * r * h.size * SPREAD;
        const near = toEdge(h.angle, halfW, halfH);
        const far = Math.max(near, reach * h.far);
        let y0 = Math.sin(h.angle) * far;
        y0 = Math.min(Math.max(y0, top + full / 2), H / 2 - 8 - full / 2);
        const s = el.style;
        s.width = `${full.toFixed(1)}px`;
        s.setProperty('--x0', `${(Math.cos(h.angle) * far - full / 2).toFixed(1)}px`);
        s.setProperty('--y0', `${(y0 - full / 2).toFixed(1)}px`);
        s.setProperty('--x1', `${(Math.cos(h.angle) * near - full / 2).toFixed(1)}px`);
        s.setProperty('--y1', `${(Math.sin(h.angle) * near - full / 2).toFixed(1)}px`);
      });
      root.style.setProperty('--ring', `${(GAP + 2 * rMax).toFixed(1)}px`);
    };

    place();
    root.dataset.placed = 'true';
    const ro = new ResizeObserver(place);
    ro.observe(root);
    ro.observe(question);
    return () => ro.disconnect();
  }, []);

  // ---- the glide into the home, once ----
  useEffect(() => {
    if (isDone()) return;
    const html = document.documentElement;
    const root = rootRef.current;
    let gone = false;
    let settle: ReturnType<typeof setTimeout>;

    const finish = () => {
      if (gone || isDone() || !root) return;
      gone = true;
      stopListening();
      clearTimeout(timer);
      try {
        sessionStorage.setItem(INTRO_SEEN_KEY, '1');
      } catch {
        // Storage blocked: it simply plays again next time.
      }
      if (prefersReducedMotion()) {
        html.dataset.intro = 'done';
        return;
      }
      // FLIP: note where the question and the slips are, switch to the home,
      // put them back where they were with a transform, then let them glide to
      // their new places. Only transforms move, on the compositor; the hearts
      // glide from scattered to gathered on their own transition, inside the
      // moving question, so they arrive with it.
      const moving = [...root.querySelectorAll<HTMLElement>('[data-glide]')];
      const before = moving.map((el) => el.getBoundingClientRect().top);
      html.dataset.gliding = 'prep';
      html.dataset.intro = 'done';
      moving.forEach((el, i) => {
        el.style.transform = `translate3d(0, ${(before[i] - el.getBoundingClientRect().top).toFixed(1)}px, 0)`;
      });
      void root.offsetHeight; // the starting places, laid down before the glide
      html.dataset.gliding = 'run';
      moving.forEach((el) => (el.style.transform = ''));
      settle = setTimeout(() => delete html.dataset.gliding, 1100);
    };

    // Anything the student does first takes them straight in.
    const EVENTS = ['pointerdown', 'wheel', 'keydown', 'scroll', 'touchstart'] as const;
    const stopListening = () => EVENTS.forEach((e) => window.removeEventListener(e, finish));
    EVENTS.forEach((e) => window.addEventListener(e, finish, { passive: true }));
    const timer = setTimeout(finish, prefersReducedMotion() ? 600 : HOLD);

    return () => {
      stopListening();
      clearTimeout(timer);
      clearTimeout(settle);
    };
  }, []);

  return (
    <div ref={rootRef} className={styles.top}>
      <div className={styles.scene}>
        <p className={styles.kicker} data-kicker>
          {kicker}
        </p>

        <div className={styles.question} data-glide>
          <div className={styles.hearts} aria-hidden="true">
            {HEARTS.map((h, i) => (
              <div key={i} data-heart className={styles.heart}>
                <span className={styles.wobble} style={{ animationDelay: `${(-h.phase * 1.7).toFixed(2)}s` }}>
                  <HeartGlyph d={shapes[i]} colour={rgb(moodColour(h.e, h.w))} className={styles.glyph} />
                </span>
              </div>
            ))}
          </div>

          <h1 className={styles.line} data-question>
            {line.map((phrase) => (
              <span key={phrase}>{phrase}</span>
            ))}
          </h1>
        </div>
      </div>

      <div className={styles.slips} data-glide>
        {children}
      </div>
    </div>
  );
}
