'use client';

import { useRef, type CSSProperties, type KeyboardEvent, type PointerEvent } from 'react';

import { haptic } from '@/lib/haptics';

import { chargeCss, JellyHeart, type HeartPoke } from './JellyHeart';
import styles from './HeartMeter.module.css';

/** Which third of 0 → 1 a value is in: the answer that is stored. */
export const third = (v: number) => (v < 1 / 3 ? 0 : v < 2 / 3 ? 1 : 2);

const clamp = (v: number) => Math.min(1, Math.max(0, v));

/** The weight the heart shows while energy is being asked, before weight is known. */
const NEUTRAL_WEIGHT = 0.3;

/**
 * The booth kiosk's feeling question, asked on the student's own jelly heart
 * (./JellyHeart). One gesture for both questions — drag sideways — and it works
 * anywhere: on the heart, on the rail under it, or by grabbing the yellow handle.
 *
 *  - energy: the heart fills with glowing charge like a battery, and its eyes
 *    open wider as it fills.
 *  - weight: it gets heavy like a water balloon, and its smile turns to a frown.
 *
 * Crossing into a new feeling gives the heart a small pop (and a tap, on devices
 * that can), and the line under it changes. Until it is touched, a ghost finger
 * shows the gesture. Arrow keys answer it too.
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
  const heartRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLSpanElement>(null);
  const poke = useRef<HeartPoke>({ dragging: false, angle: 0, pops: 0 });
  const band = useRef(third(value));

  const e = axis === 'energy' ? value : (energy ?? 0.5);
  const w = axis === 'weight' ? value : NEUTRAL_WEIGHT;

  /** Set the answer; crossing into a new third gives the heart a small pop. */
  const set = (v: number) => {
    const b = third(v);
    if (b !== band.current) {
      band.current = b;
      poke.current.pops += 1;
      haptic('step');
    }
    onChange(v);
  };

  // Wherever the finger is, its position along the rail is the answer, so the
  // heart, the rail and the handle all move the same thing.
  const read = (ev: PointerEvent<HTMLDivElement>) => {
    const rail = railRef.current?.getBoundingClientRect();
    if (!rail || rail.width === 0) return;
    const h = heartRef.current?.getBoundingClientRect();
    if (h) poke.current.angle = Math.atan2(ev.clientY - (h.top + h.height / 2), ev.clientX - (h.left + h.width / 2));
    set(clamp((ev.clientX - rail.left) / rail.width));
  };

  const down = (ev: PointerEvent<HTMLDivElement>) => {
    poke.current.dragging = true;
    ev.currentTarget.setPointerCapture(ev.pointerId);
    read(ev);
  };
  const move = (ev: PointerEvent<HTMLDivElement>) => {
    if (poke.current.dragging) read(ev);
  };
  const up = () => {
    poke.current.dragging = false;
  };

  const key = (ev: KeyboardEvent<HTMLDivElement>) => {
    const step = ev.shiftKey ? 0.2 : 0.05;
    if (ev.key === 'ArrowRight' || ev.key === 'ArrowUp') set(clamp(value + step));
    else if (ev.key === 'ArrowLeft' || ev.key === 'ArrowDown') set(clamp(value - step));
    else return;
    ev.preventDefault();
  };

  const b = third(value);

  return (
    <div
      className={styles.meter}
      data-touched={touched}
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
      style={{ '--v': value, '--fill': chargeCss(e, w) } as CSSProperties}
    >
      <div className={styles.stage} ref={heartRef}>
        <JellyHeart energy={e} weight={w} poke={poke} />
        {/* A ghost finger shows the gesture, until the heart is touched. */}
        {!touched && (
          <span className={styles.ghost} aria-hidden="true">
            <span className={styles.finger} />
            <span className={styles.bubble}>{dragMe}</span>
          </span>
        )}
      </div>

      {/* The rail: which way is which, and a handle to grab. */}
      <div className={styles.axis} aria-hidden="true">
        <span className={styles.end}>
          {axis === 'energy' ? <BatteryIcon level={0.12} /> : <BagIcon books={0} />}
          {ends.low}
        </span>
        <span className={styles.rail} ref={railRef}>
          <span className={styles.railFill} />
          <span className={styles.handle}>
            <svg viewBox="0 0 48 24">
              <path d="M14 5 L6 12 L14 19 M34 5 L42 12 L34 19" />
            </svg>
          </span>
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

/** A small battery for the rail's ends. */
function BatteryIcon({ level }: { level: number }) {
  return (
    <svg viewBox="0 0 40 22" className={styles.icon}>
      <rect x="1.5" y="1.5" width="32" height="19" rx="5" fill="none" stroke="currentColor" strokeWidth="3" />
      <rect x="35" y="7" width="4" height="8" rx="1.5" fill="currentColor" />
      <rect x="5" y="5" width={25 * level} height="12" rx="2.5" fill={level > 0.5 ? '#6FD7B8' : '#FF48B0'} />
    </svg>
  );
}

/** A small school bag for the rail's ends. */
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
