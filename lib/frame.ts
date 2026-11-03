/**
 * One animation loop for every moving heart in User Mode.
 *
 * Each living heart used to run its own requestAnimationFrame forever, on screen
 * or not, in a background tab or not. Here they share one loop that:
 *  - runs only while something is subscribed (components subscribe while visible),
 *  - stops while the tab is hidden,
 *  - on a phone that cannot keep up (average frame over ~24ms), asks morphing
 *    shapes to update every other frame, so scrolling and dragging stay smooth.
 *
 * Browser only; import from client components.
 */

export type FrameFn = (now: number, info: FrameInfo) => void;

export interface FrameInfo {
  /** Seconds since the previous frame, capped at 0.05. */
  dt: number;
  /** True on frames a costly update (a path morph) may skip on a slow phone. */
  skip: boolean;
}

const subs = new Set<FrameFn>();
let raf = 0;
let last = 0;
let avg = 16;
let n = 0;
let slow = false;

function tick(now: number) {
  raf = 0;
  if (document.hidden || subs.size === 0) return;
  const raw = last ? now - last : 16;
  last = now;
  // Smoothed frame time; a long pause (tab switch) is not a slow phone.
  if (raw < 200) avg += (raw - avg) * 0.06;
  slow = avg > 24;
  n += 1;
  const info: FrameInfo = { dt: Math.min(0.05, raw / 1000), skip: slow && n % 2 === 1 };
  subs.forEach((fn) => fn(now, info));
  raf = requestAnimationFrame(tick);
}

function start() {
  if (!raf && !document.hidden && subs.size) {
    last = 0;
    raf = requestAnimationFrame(tick);
  }
}

let listening = false;
function listen() {
  if (listening || typeof document === 'undefined') return;
  listening = true;
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelAnimationFrame(raf);
      raf = 0;
    } else start();
  });
}

/** Run `fn` every frame until the returned function is called. */
export function subscribe(fn: FrameFn): () => void {
  listen();
  subs.add(fn);
  start();
  return () => {
    subs.delete(fn);
    if (!subs.size && raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  };
}

/** Reduced motion, read once per call (it can change while the page is open). */
export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
