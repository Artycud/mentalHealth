'use client';

import { useEffect, useId, useRef, type KeyboardEvent, type PointerEvent } from 'react';

import { haptic } from '@/lib/haptics';
import { rgb } from '@/lib/heart';
import { prefersReducedMotion, subscribe } from '@/lib/frame';

import styles from './HeartMeter.module.css';

/** Which third of 0 → 1 a value is in: the answer that is stored. */
export const third = (v: number) => (v < 1 / 3 ? 0 : v < 2 / 3 ? 1 : 2);

const clamp = (v: number) => Math.min(1, Math.max(0, v));

/** The weight the heart shows while energy is being asked, before weight is known. */
const NEUTRAL_WEIGHT = 0.3;

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
function charge(e: number, w: number): RGB {
  const c = e < 0.5 ? mix(PINK, GOLD, e * 2) : mix(GOLD, MINT, (e - 0.5) * 2);
  return mix(c, HEAVY, Math.max(0, w - 0.25) * 0.75);
}

const POINTS = 44;

/**
 * A jelly ♥ around 0,0: the classic heart curve, wobbling (livelier with more
 * energy), squashed wide and low by weight, and stretched toward a finger. Returns
 * its path and how high and low it reaches, for the charge inside.
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
    // most at the tip.
    // Clamped: the top of the lobes sits a touch above -12.5, and a negative number
    // to a fractional power is NaN, which would blank the whole heart.
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
 * The booth kiosk's feeling question: the home's jelly heart, and you drag the
 * heart itself.
 *
 *  - energy: drag sideways. The heart fills with glowing charge, like a battery,
 *    the liquid sloshes as it moves, and a fuller heart wobbles livelier.
 *  - weight: drag sideways too (one gesture to learn for both). The heart gets
 *    heavy like a water balloon: its lower half droops, it sinks and spreads,
 *    dims, slows, and presses a darker shadow into the ground. The charge from
 *    the first question stays inside it, deepening in colour.
 *
 * It is alive the whole time (the same shared frame loop as the home's heart):
 * it breathes, it leans toward the finger, its size and level spring to the
 * answer rather than jump, and crossing into a new feeling gives it a small pop
 * (and a tap, on devices that can). Until it is touched, a ghost finger shows
 * which way to drag. Arrow keys answer it too.
 */
export function HeartMeter({
  axis,
  value,
  energy,
  touched,
  onChange,
  ends,
  anchors,
  label,
  dragMe,
}: {
  axis: 'energy' | 'weight';
  /** The value being asked, 0 → 1. */
  value: number;
  /** The answered energy, while weight is asked. */
  energy?: number;
  touched: boolean;
  onChange: (v: number) => void;
  ends: { low: string; high: string };
  anchors: [string, string, string];
  /** The question, for screen readers. */
  label: string;
  dragMe: string;
}) {
  const id = `hm${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const stageRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<SVGPathElement>(null);
  const clipRef = useRef<SVGPathElement>(null);
  const liquidRef = useRef<SVGPathElement>(null);
  const bubblesRef = useRef<SVGGElement>(null);
  const stopTop = useRef<SVGStopElement>(null);
  const stopBottom = useRef<SVGStopElement>(null);
  const pctRef = useRef<SVGTextElement>(null);
  const shadeRef = useRef<SVGRectElement>(null);
  const shadowRef = useRef<SVGEllipseElement>(null);
  const glowRef = useRef<SVGStopElement>(null);

  // What the loop reads: the latest answer, mirrored from props.
  const target = useRef({ e: 0.5, w: NEUTRAL_WEIGHT, dragging: false, angle: 0 });
  useEffect(() => {
    target.current.e = axis === 'energy' ? value : (energy ?? 0.5);
    target.current.w = axis === 'weight' ? value : NEUTRAL_WEIGHT;
  }, [axis, value, energy]);

  // What is drawn: springs toward the answer, so it has weight.
  const shown = useRef({ e: 0.5, ve: 0, w: NEUTRAL_WEIGHT, vw: 0, pull: 0, kick: 0, t0: 0 });
  const band = useRef(third(value));

  useEffect(() => {
    const reduce = prefersReducedMotion();
    const m = shown.current;
    if (!m.t0) m.t0 = performance.now();

    const frame = (now: number, dt: number, skip: boolean) => {
      const tg = target.current;
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
      m.pull += ((tg.dragging ? 1 : 0) - m.pull) * Math.min(1, dt * 8);
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
        pullAngle: tg.angle,
        pull: m.pull,
      });
      bodyRef.current?.setAttribute('d', d);
      clipRef.current?.setAttribute('d', d);
      // A heavy heart dims, and presses a wider, darker shadow into the ground.
      shadeRef.current?.setAttribute('opacity', (w * 0.46).toFixed(3));
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
      if (pctRef.current) {
        pctRef.current.textContent = `${Math.round(clamp(tg.e) * 100)}%`;
        pctRef.current.setAttribute('y', (top + (bottom - top) * 0.42).toFixed(1));
      }
    };

    if (reduce) {
      const timer = setInterval(() => frame(performance.now(), 1, false), 120);
      frame(performance.now(), 1, false);
      return () => clearInterval(timer);
    }
    return subscribe((now, info) => frame(now, info.dt, info.skip));
  }, []);

  /** Set the answer; crossing into a new third gives the heart a small pop. */
  const set = (v: number) => {
    const b = third(v);
    if (b !== band.current) {
      band.current = b;
      shown.current.kick = 0.07;
      haptic('step');
    }
    onChange(v);
  };

  const read = (e: PointerEvent<HTMLDivElement>) => {
    const r = stageRef.current?.getBoundingClientRect();
    if (!r) return;
    const x = clamp((e.clientX - r.left) / r.width);
    const y = clamp((e.clientY - r.top) / r.height);
    // The heart leans toward the finger.
    target.current.angle = Math.atan2(y - 0.5, x - 0.5);
    // The middle 80% of the width, so both ends are easy to reach.
    set(clamp((x - 0.1) / 0.8));
  };

  const down = (e: PointerEvent<HTMLDivElement>) => {
    target.current.dragging = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    read(e);
  };
  const move = (e: PointerEvent<HTMLDivElement>) => {
    if (target.current.dragging) read(e);
  };
  const up = () => {
    target.current.dragging = false;
  };

  const key = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = e.shiftKey ? 0.2 : 0.05;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') set(clamp(value + step));
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') set(clamp(value - step));
    else return;
    e.preventDefault();
  };

  const b = third(value);

  return (
    <div className={styles.meter} data-axis={axis} data-touched={touched}>
      <div
        ref={stageRef}
        className={styles.stage}
        role="slider"
        tabIndex={0}
        aria-label={label}
        aria-orientation="horizontal"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(value * 100)}
        aria-valuetext={anchors[b]}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        onKeyDown={key}
      >
        <svg viewBox="-230 -200 460 420" className={styles.svg} aria-hidden="true">
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
          <ellipse ref={shadowRef} cx="0" cy="200" rx="120" ry="20" fill={`url(#${id}-shadow)`} />
          {/* The glass of the heart, then the charge inside it, then its shine. */}
          <path ref={bodyRef} fill={`url(#${id}-glass)`} className={styles.rim} />
          <g clipPath={`url(#${id}-clip)`}>
            <path ref={liquidRef} fill={`url(#${id}-liquid)`} />
            <g ref={bubblesRef} fill="#ffffff">
              {[0, 1, 2, 3, 4].map((i) => (
                <circle key={i} r={5 + (i % 3) * 2} />
              ))}
            </g>
            <rect ref={shadeRef} x="-230" y="-200" width="460" height="420" fill="#0b1536" opacity="0" />
          </g>
          <g clipPath={`url(#${id}-clip)`}>
            <rect x="-230" y="-200" width="460" height="420" fill={`url(#${id}-shine)`} />
          </g>
          {axis === 'energy' && <text ref={pctRef} x="0" y="60" className={styles.pct} textAnchor="middle" />}
        </svg>

        {/* A ghost finger shows which way to drag, until the heart is touched. */}
        {!touched && (
          <span className={styles.ghost} aria-hidden="true">
            <span className={styles.finger} />
            <span className={styles.bubble}>{dragMe}</span>
          </span>
        )}
      </div>

      {/* The axis, quietly: which way is which, and where the answer sits. */}
      <div className={styles.axis} aria-hidden="true" style={{ '--v': value } as React.CSSProperties}>
        <span className={styles.end}>
          {axis === 'energy' ? <BatteryIcon level={0.12} /> : <BagIcon books={0} />}
          {ends.low}
        </span>
        <span className={styles.rail}>
          <span className={styles.dot} />
        </span>
        <span className={styles.end}>
          {axis === 'energy' ? <BatteryIcon level={1} /> : <BagIcon books={4} />}
          {ends.high}
        </span>
      </div>

      {/* Re-keyed per third, so the line pops as the feeling changes. */}
      <p className={styles.anchor} key={b} aria-live="polite">
        {anchors[b]}
      </p>
    </div>
  );
}

/** A small battery for the axis' ends. */
function BatteryIcon({ level }: { level: number }) {
  return (
    <svg viewBox="0 0 40 22" className={styles.icon}>
      <rect x="1.5" y="1.5" width="32" height="19" rx="5" fill="none" stroke="currentColor" strokeWidth="3" />
      <rect x="35" y="7" width="4" height="8" rx="1.5" fill="currentColor" />
      <rect x="5" y="5" width={25 * level} height="12" rx="2.5" fill={level > 0.5 ? '#6FD7B8' : '#FF48B0'} />
    </svg>
  );
}

/** A small school bag for the axis' ends. */
function BagIcon({ books }: { books: number }) {
  return (
    <svg viewBox="0 0 30 32" className={styles.icon}>
      <path d="M10 8 C10 2 20 2 20 8" fill="none" stroke="currentColor" strokeWidth="2.6" />
      <rect x="3" y="7" width="24" height="23" rx="7" fill="none" stroke="currentColor" strokeWidth="2.6" />
      {Array.from({ length: books }, (_, i) => (
        <rect key={i} x="8" y={23 - i * 4} width="14" height="3" rx="1" fill={['#FF48B0', '#0078BF', '#FFB511', '#6FD7B8'][i % 4]} />
      ))}
    </svg>
  );
}
