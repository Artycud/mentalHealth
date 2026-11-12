'use client';

import { useEffect, useId, useRef, type RefObject } from 'react';

import { prefersReducedMotion, subscribe } from '@/lib/frame';
import { rgb } from '@/lib/heart';

import styles from './JellyHeart.module.css';

const clamp = (v: number) => Math.min(1, Math.max(0, v));

type RGB = [number, number, number];
const mix = (a: RGB, b: RGB, t: number): RGB => [0, 1, 2].map((i) => a[i] + (b[i] - a[i]) * t) as RGB;
const PINK: RGB = [255, 72, 176];
const GOLD: RGB = [255, 181, 17];
const MINT: RGB = [92, 222, 176];
const HEAVY: RGB = [96, 88, 210];

/**
 * The charge's colour: vivid, like a phone's battery — pink nearly empty, gold half
 * way, mint full — and, as the heart gets heavy, sinking toward a deep violet.
 */
export function charge(e: number, w: number): RGB {
  const c = e < 0.5 ? mix(PINK, GOLD, e * 2) : mix(GOLD, MINT, (e - 0.5) * 2);
  return mix(c, HEAVY, Math.max(0, w - 0.25) * 0.75);
}

/** The charge colour as CSS, for anything that should match a heart. */
export const chargeCss = (e: number, w: number) => rgb(charge(e, w));

const POINTS = 44;

/**
 * A jelly ♥ around 0,0: the classic heart curve, wobbling (livelier with more
 * energy), squashed wide and drooping like a water balloon with weight, and
 * stretched toward a finger. Returns its path and how high and low it reaches.
 */
function heartPath(o: { energy: number; weight: number; t: number; scale: number; pullAngle: number; pull: number }) {
  const k = 8.6 * o.scale;
  const amp = 0.012 + o.energy * 0.03;
  // Heavy jelly moves slower, spreads wider and sits lower.
  const speed = (1.2 + o.energy * 2.6) * (1 - o.weight * 0.55);
  const sx = 1 + o.weight * 0.18;
  const sy = 1 - o.weight * 0.2;
  const sink = o.weight * 44 - (1 - o.weight) * 10;
  const pts: [number, number][] = [];
  let top = Infinity;
  let bottom = -Infinity;
  for (let i = 0; i < POINTS; i += 1) {
    const a = (i / POINTS) * Math.PI * 2;
    const hx = 16 * Math.sin(a) ** 3;
    const hy = -(13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a)) - 2.5;
    const angle = Math.atan2(hy, hx);
    // Slow, broad bulges travelling round the heart: jelly, not a crinkled edge.
    const wobble = Math.sin(2 * a + o.t * speed) * amp + Math.sin(3 * a - o.t * speed * 0.7) * amp * 0.6;
    const toward = Math.max(0, Math.cos(angle - o.pullAngle)) ** 3 * o.pull * 0.1;
    const f = 1 + wobble + toward;
    // Weight pulls the lower half down like a water balloon: nothing at the top,
    // most at the tip. Clamped: a negative number to a fractional power is NaN,
    // which would blank the whole heart.
    const droop = o.weight * 66 * Math.max(0, (hy + 12.5) / 29) ** 2.2;
    const x = hx * k * f * sx * (1 - o.weight * 0.1 * Math.max(0, hy / 17));
    const y = hy * k * f * sy + sink + droop;
    top = Math.min(top, y);
    bottom = Math.max(bottom, y);
    pts.push([x, y]);
  }
  const p = (i: number) => pts[(i + POINTS) % POINTS];
  let d = `M${p(0)[0].toFixed(1)} ${p(0)[1].toFixed(1)}`;
  for (let i = 0; i < POINTS; i += 1) {
    const [p0, p1, p2, p3] = [p(i - 1), p(i), p(i + 1), p(i + 2)];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return { d: `${d} Z`, top, bottom };
}

/**
 * What a hand does to a heart: whether it is holding it, where it pulls, and how
 * many times it has asked for a pop. The owner writes it; the heart only reads it.
 */
export interface HeartPoke {
  dragging: boolean;
  /** Radians, from the heart's centre toward the finger. */
  angle: number;
  /** Add one for a small pop. */
  pops: number;
}

/**
 * The booth's jelly heart, and its face. One drawing, used everywhere the kiosk
 * shows "your heart": large while it is being made, small beside the later
 * questions, and on the result, as the heart the student made today.
 *
 *  - energy (0 → 1) fills it with glowing charge, like a phone battery, that
 *    sloshes and fizzes; a fuller heart wobbles livelier and its eyes open wide.
 *  - weight (0 light → 1 heavy) makes it heavy like a water balloon: it droops,
 *    sinks, dims and slows, and its smile turns to a worried frown.
 *
 * It is alive on the shared frame loop (lib/frame): it breathes, blinks, springs
 * to a new answer rather than jumping, and leans toward a finger (`poke`). Under
 * reduced motion it holds still and only changes when the answer does.
 */
export function JellyHeart({
  energy,
  weight,
  poke,
  className,
  label,
}: {
  energy: number;
  weight: number;
  poke?: RefObject<HeartPoke>;
  className?: string;
  /** Read out for screen readers; the heart is decorative without it. */
  label?: string;
}) {
  const id = `jh${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const bodyRef = useRef<SVGPathElement>(null);
  const clipRef = useRef<SVGPathElement>(null);
  const liquidRef = useRef<SVGPathElement>(null);
  const bubblesRef = useRef<SVGGElement>(null);
  const stopTop = useRef<SVGStopElement>(null);
  const stopBottom = useRef<SVGStopElement>(null);
  const shadeRef = useRef<SVGRectElement>(null);
  const shadowRef = useRef<SVGEllipseElement>(null);
  const glowRef = useRef<SVGStopElement>(null);
  const faceRef = useRef<SVGGElement>(null);
  const eyeL = useRef<SVGEllipseElement>(null);
  const eyeR = useRef<SVGEllipseElement>(null);
  const mouthRef = useRef<SVGPathElement>(null);
  const mouthUnder = useRef<SVGPathElement>(null);
  const browsRef = useRef<SVGPathElement>(null);
  const browsUnder = useRef<SVGPathElement>(null);
  const cheeksRef = useRef<SVGGElement>(null);

  // The answer the heart is heading for, mirrored from props for the loop.
  const target = useRef({ e: energy, w: weight });
  useEffect(() => {
    target.current.e = energy;
    target.current.w = weight;
  }, [energy, weight]);

  // What is drawn: springs toward the answer, so it has weight. It starts a little
  // off, so a heart arriving on a new screen settles in with a small wobble.
  const shown = useRef({ e: energy * 0.6, ve: 0, w: weight * 0.6, vw: 0, pull: 0, kick: 0, pops: 0, t0: 0 });

  useEffect(() => {
    const reduce = prefersReducedMotion();
    const m = shown.current;
    if (!m.t0) m.t0 = performance.now() - Math.random() * 3000;

    const frame = (now: number, dt: number, skip: boolean) => {
      const tg = target.current;
      const hand = poke?.current;
      const t = reduce ? 0 : (now - m.t0) / 1000;
      // A soft spring with a little overshoot: it settles, it does not snap.
      const k = 90;
      const damp = 13;
      m.ve += ((tg.e - m.e) * k - m.ve * damp) * dt;
      m.e += m.ve * dt;
      m.vw += ((tg.w - m.w) * k - m.vw * damp) * dt;
      m.w += m.vw * dt;
      if (reduce) {
        m.e = tg.e;
        m.w = tg.w;
        m.ve = m.vw = 0;
      }
      m.pull += ((hand?.dragging ? 1 : 0) - m.pull) * Math.min(1, dt * 8);
      // A new pop asked for: a quick swell that settles by itself.
      if (hand && hand.pops !== m.pops) {
        m.pops = hand.pops;
        m.kick = 0.08;
      }
      m.kick += (0 - m.kick) * Math.min(1, dt * 7);
      if (skip) return;

      const e = clamp(m.e);
      const w = clamp(m.w);
      const breathe = reduce ? 0 : Math.sin(t * 1.6) * 0.015;
      const { d, top, bottom } = heartPath({
        energy: e,
        weight: w,
        t,
        scale: 1 + breathe + m.kick,
        pullAngle: hand?.angle ?? 0,
        pull: m.pull,
      });
      bodyRef.current?.setAttribute('d', d);
      clipRef.current?.setAttribute('d', d);
      // A heavy heart dims, and presses a wider, darker shadow into the ground.
      shadeRef.current?.setAttribute('opacity', (w * 0.4).toFixed(3));
      shadowRef.current?.setAttribute('rx', (110 + w * 60).toFixed(1));
      shadowRef.current?.setAttribute('opacity', (0.55 + w * 0.45).toFixed(3));

      // The charge: a liquid surface whose height is energy, sloshing as it moves.
      const level = bottom - (0.06 + e * 0.9) * (bottom - top);
      const slosh = Math.min(22, Math.abs(m.ve) * 26) + (reduce ? 0 : 5);
      let p = `M-240 ${bottom + 60} L-240 ${level.toFixed(1)}`;
      for (let x = -240; x <= 240; x += 20) {
        const y = level + Math.sin(x * 0.028 + t * 2.4) * slosh + Math.sin(x * 0.05 - t * 1.7) * slosh * 0.35;
        p += ` L${x} ${y.toFixed(1)}`;
      }
      p += ` L240 ${bottom + 60} Z`;
      liquidRef.current?.setAttribute('d', p);

      // A little fizz rising in a lively heart.
      const bubbles = bubblesRef.current?.children;
      if (bubbles) {
        for (let i = 0; i < bubbles.length; i += 1) {
          const phase = (t * (0.25 + i * 0.07) + i * 0.37) % 1;
          const y = bottom - phase * (bottom - level);
          const x = -70 + i * 34 + Math.sin(t * 2 + i) * 8;
          const c = bubbles[i] as SVGCircleElement;
          c.setAttribute('cx', x.toFixed(1));
          c.setAttribute('cy', y.toFixed(1));
          c.setAttribute('opacity', reduce ? '0' : String(Math.max(0, e - 0.35) * 0.9 * (1 - phase)));
        }
      }

      const c = charge(e, w);
      stopTop.current?.setAttribute('stop-color', rgb(mix(c, [255, 255, 255], 0.3)));
      stopBottom.current?.setAttribute('stop-color', rgb(c));
      glowRef.current?.setAttribute('stop-color', rgb(c));

      // ---- the face: how the heart feels, at a glance ----
      const cy = top + (bottom - top) * 0.42;
      faceRef.current?.setAttribute('transform', `translate(0 ${cy.toFixed(1)})`);
      // Eyes: sleepy slits on an empty battery, round and wide on a full one; a
      // blink every few seconds.
      const blink = reduce ? 1 : (t % 3.7) < 0.14 ? 0.12 : 1;
      const ry = (3.5 + e * 9) * blink;
      for (const eye of [eyeL.current, eyeR.current]) eye?.setAttribute('ry', ry.toFixed(1));
      // Mouth: a smile when light, flat in between, a wobbly frown when heavy;
      // a full battery smiles a little wider, an empty one a little less.
      const curve = 15 - w * 34 + (e - 0.5) * 12;
      const width = 20 + e * 8;
      const jitter = reduce ? 0 : Math.sin(t * 9) * Math.max(0, w - 0.6) * 3;
      const mouth = `M${-width} 30 Q0 ${(30 + curve + jitter).toFixed(1)} ${width} 30`;
      mouthRef.current?.setAttribute('d', mouth);
      mouthUnder.current?.setAttribute('d', mouth);
      // Worried brows, only once it is really heavy.
      const lift = Math.max(0, w - 0.45) * 22;
      const brows = `M-50 ${(-24 + lift * 0.2).toFixed(1)} L-22 ${(-24 - lift).toFixed(1)} M50 ${(-24 + lift * 0.2).toFixed(1)} L22 ${(-24 - lift).toFixed(1)}`;
      browsRef.current?.setAttribute('d', brows);
      browsUnder.current?.setAttribute('d', brows);
      const browOpacity = clamp((w - 0.45) * 3).toFixed(2);
      browsRef.current?.setAttribute('opacity', browOpacity);
      browsUnder.current?.setAttribute('opacity', browOpacity);
      // Rosy cheeks on a light heart.
      cheeksRef.current?.setAttribute('opacity', ((1 - w) * 0.55).toFixed(2));
    };

    if (reduce) {
      const timer = setInterval(() => frame(performance.now(), 1, false), 120);
      frame(performance.now(), 1, false);
      return () => clearInterval(timer);
    }
    return subscribe((now, info) => frame(now, info.dt, info.skip));
  }, [poke]);

  return (
    <svg
      viewBox="-230 -200 460 430"
      className={`${styles.heart} ${className ?? ''}`}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <defs>
        <clipPath id={`${id}-clip`}>
          <path ref={clipRef} />
        </clipPath>
        <linearGradient id={`${id}-liquid`} x1="0" y1="0" x2="0" y2="1">
          <stop ref={stopTop} offset="0" stopColor="#ffd36b" />
          <stop ref={stopBottom} offset="1" stopColor="#ffb511" />
        </linearGradient>
        <radialGradient id={`${id}-shine`} cx="34%" cy="22%" r="34%">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.85" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${id}-glass`} cx="45%" cy="35%" r="75%">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.2" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0.06" />
        </radialGradient>
        <radialGradient id={`${id}-glow`}>
          <stop ref={glowRef} offset="0" stopColor="#ffb511" stopOpacity="0.4" />
          <stop offset="1" stopColor="#ffb511" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${id}-shadow`}>
          <stop offset="0" stopColor="#000000" stopOpacity="0.4" />
          <stop offset="1" stopColor="#000000" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* The charge's own light, spilling round the heart, and its shadow below. */}
      <ellipse cx="0" cy="10" rx="215" ry="195" fill={`url(#${id}-glow)`} />
      <ellipse ref={shadowRef} cx="0" cy="206" rx="120" ry="20" fill={`url(#${id}-shadow)`} />
      {/* The glass of the heart, the charge inside it, then its shine. */}
      <path ref={bodyRef} fill={`url(#${id}-glass)`} className={styles.rim} />
      <g clipPath={`url(#${id}-clip)`}>
        <path ref={liquidRef} fill={`url(#${id}-liquid)`} />
        <g ref={bubblesRef} fill="#ffffff">
          {[0, 1, 2, 3, 4].map((i) => (
            <circle key={i} r={5 + (i % 3) * 2} />
          ))}
        </g>
        <rect ref={shadeRef} x="-230" y="-200" width="460" height="430" fill="#0b1536" opacity="0" />
        <rect x="-230" y="-200" width="460" height="430" fill={`url(#${id}-shine)`} />
      </g>
      {/* The face. Each line is drawn twice, paper under navy, so it reads on the
          dark glass and on bright charge alike. */}
      <g ref={faceRef}>
        <g ref={cheeksRef} className={styles.cheeks}>
          <ellipse cx="-62" cy="16" rx="15" ry="9" />
          <ellipse cx="62" cy="16" rx="15" ry="9" />
        </g>
        <path ref={browsUnder} className={styles.under} />
        <path ref={browsRef} className={styles.line} />
        <ellipse ref={eyeL} cx="-36" cy="-2" rx="9" ry="9" className={styles.eye} />
        <ellipse ref={eyeR} cx="36" cy="-2" rx="9" ry="9" className={styles.eye} />
        <path ref={mouthUnder} className={styles.under} />
        <path ref={mouthRef} className={styles.line} />
      </g>
    </svg>
  );
}
