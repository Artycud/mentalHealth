'use client';

import { useRef, type CSSProperties, type KeyboardEvent, type PointerEvent } from 'react';

import type { MeterKind } from '@/content/th/booth';

import styles from './FeelingMeter.module.css';

/** Which third of 0 → 1 a value is in: the answer that is stored. */
export const third = (v: number) => (v < 1 / 3 ? 0 : v < 2 / 3 ? 1 : 2);

const clamp = (v: number) => Math.min(1, Math.max(0, v));

const PINK = [255, 72, 176];
const SUN = [255, 181, 17];
const MINT = [111, 215, 184];
const mixRgb = (a: number[], b: number[], t: number) =>
  `rgb(${a.map((x, i) => Math.round(x + (b[i] - x) * t)).join(' ')})`;

/** A battery's charge colour: pink when nearly empty, marigold half way, mint when full. */
export const batteryColour = (v: number) => (v < 0.5 ? mixRgb(PINK, SUN, v * 2) : mixRgb(SUN, MINT, (v - 0.5) * 2));

/**
 * One feeling, asked as a drag (the booth kiosk). A picture everyone knows — a
 * phone battery, a school bag — follows the finger, and a line under it says what
 * that much feels like. Drag anywhere on the picture or the track, or tap a spot;
 * the arrow keys work too. Until it is touched, the handle nudges side to side and
 * says "ลากเลย", so nobody has to be told what to do.
 */
export function FeelingMeter({
  kind,
  value,
  touched,
  onChange,
  ends,
  anchors,
  label,
  dragMe,
}: {
  kind: MeterKind;
  value: number;
  touched: boolean;
  onChange: (v: number) => void;
  ends: { low: string; high: string };
  anchors: [string, string, string];
  /** The question, for screen readers. */
  label: string;
  dragMe: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const fromX = (clientX: number) => {
    const r = trackRef.current?.getBoundingClientRect();
    if (!r || r.width === 0) return value;
    return clamp((clientX - r.left) / r.width);
  };

  const down = (e: PointerEvent<HTMLDivElement>) => {
    dragging.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    onChange(fromX(e.clientX));
  };
  const move = (e: PointerEvent<HTMLDivElement>) => {
    if (dragging.current) onChange(fromX(e.clientX));
  };
  const up = () => {
    dragging.current = false;
  };

  const key = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = e.shiftKey ? 0.2 : 0.05;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') onChange(clamp(value + step));
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') onChange(clamp(value - step));
    else if (e.key === 'Home') onChange(0);
    else if (e.key === 'End') onChange(1);
    else return;
    e.preventDefault();
  };

  const band = third(value);
  const fill = kind === 'battery' ? batteryColour(value) : mixRgb(SUN, PINK, value);
  const pct = Math.round(value * 100);

  return (
    <div
      className={styles.meter}
      data-touched={touched}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
      style={{ '--v': value, '--fill': fill } as CSSProperties}
    >
      <div className={styles.picture} aria-hidden="true">
        {kind === 'battery' ? <Battery v={value} colour={fill} /> : <Bag v={value} />}
      </div>

      <div className={styles.trackWrap}>
        <div className={styles.track} ref={trackRef}>
          <span className={styles.trackFill} />
          <div
            className={styles.thumb}
            role="slider"
            tabIndex={0}
            aria-label={label}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={pct}
            aria-valuetext={anchors[band]}
            onKeyDown={key}
          >
            <svg viewBox="0 0 48 24" aria-hidden="true">
              <path d="M14 5 L6 12 L14 19 M34 5 L42 12 L34 19" />
            </svg>
            {!touched && <span className={styles.bubble}>{dragMe}</span>}
          </div>
        </div>
        <div className={styles.ends} aria-hidden="true">
          <span>{ends.low}</span>
          <span>{ends.high}</span>
        </div>
      </div>

      {/* Re-keyed per third, so the line gives a small pop as it changes. */}
      <p className={styles.anchor} key={band} aria-live="polite">
        {kind === 'battery' && <span className={styles.pct}>{pct}%</span>}
        {anchors[band]}
      </p>
    </div>
  );
}

/** A phone battery on its side. The charge follows the finger; full gets a bolt. */
function Battery({ v, colour }: { v: number; colour: string }) {
  const w = 316 * v;
  return (
    <svg viewBox="0 0 420 220" className={styles.svg}>
      <defs>
        <clipPath id="fm-cell">
          <rect x="34" y="42" width="316" height="136" rx="20" />
        </clipPath>
      </defs>
      <rect x="14" y="22" width="356" height="176" rx="38" className={styles.case} />
      <rect x="378" y="80" width="30" height="60" rx="10" className={styles.nub} />
      <g clipPath="url(#fm-cell)">
        <rect x="34" y="42" width={w} height="136" fill={colour} className={v < 0.15 ? styles.low : undefined} />
        {/* The cell's own bars, as on a phone. */}
        {[1, 2, 3].map((i) => (
          <line key={i} x1={34 + i * 79} y1="42" x2={34 + i * 79} y2="178" className={styles.cellLine} />
        ))}
      </g>
      {v >= 0.67 && (
        <path d="M206 60 L170 118 H198 L186 162 L232 98 H202 Z" className={styles.bolt} />
      )}
    </svg>
  );
}

const BOOK_INKS = ['#FF48B0', '#0078BF', '#FFB511', '#6FD7B8'];
const MAX_BOOKS = 7;

/** A school bag, seen through: the more it holds, the more books are in it. */
function Bag({ v }: { v: number }) {
  const books = Math.round(v * MAX_BOOKS);
  const sag = v * 14;
  return (
    <svg viewBox="0 0 340 320" className={styles.svg}>
      <ellipse cx="170" cy="302" rx={86 + v * 40} ry={10 + v * 5} className={styles.floor} />
      <g transform={`translate(0 ${sag.toFixed(1)})`}>
        <path d="M128 66 C128 22 212 22 212 66" className={styles.handle} />
        <rect x="50" y="56" width="240" height="226" rx="58" className={styles.bag} />
        <defs>
          <clipPath id="fm-bag">
            <rect x="62" y="68" width="216" height="202" rx="48" />
          </clipPath>
        </defs>
        <g clipPath="url(#fm-bag)">
          {Array.from({ length: books }, (_, i) => {
            const width = 150 + ((i * 37) % 40);
            const tilt = i % 2 ? -2.5 : 2;
            return (
              <g key={i} className={styles.book}>
                <rect
                  x={170 - width / 2}
                  y={240 - i * 26}
                  width={width}
                  height="22"
                  rx="5"
                  fill={BOOK_INKS[i % BOOK_INKS.length]}
                  transform={`rotate(${tilt} 170 ${251 - i * 26})`}
                />
              </g>
            );
          })}
        </g>
        {/* Strain: little lines at the sides once it is really heavy. */}
        {v > 0.72 && (
          <g className={styles.strain}>
            <path d="M30 120 L14 112 M28 150 L10 150 M30 180 L14 188" />
            <path d="M310 120 L326 112 M312 150 L330 150 M310 180 L326 188" />
          </g>
        )}
      </g>
    </svg>
  );
}
