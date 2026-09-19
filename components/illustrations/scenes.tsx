/**
 * The four full-width scene illustrations.
 *
 * Path data is copied verbatim from reference/screens.html. The offsets are
 * deliberate: every scene draws a thin ink outline 4–6px away from its fill, as
 * if the print slipped on the second pass (BRIEF §6). The marigold's petal
 * coordinates, the battery's offset outline and the home blob's misregistered
 * outline are all intentional — do not tidy them up or make them symmetrical.
 *
 * Each scene scales to the column rather than sitting at a fixed 342px, so it
 * holds at 320px and at the 440px cap. Stroke widths stay fixed via
 * non-scaling-stroke in globals.css.
 */

import type { ResultState } from '@/lib/types';

const fluid = { width: '100%', height: 'auto', display: 'block' } as const;

/** Home (342×230): pink blob, blue circle, halftone patch, wavy line, sparkles. */
export function HomeScene() {
  return (
    <svg viewBox="0 0 342 230" aria-hidden="true" style={fluid}>
      <defs>
        {/* Halftone on a 7px grid with 1.4px ink dots (§6). */}
        <pattern id="riso-halftone-home" width="7" height="7" patternUnits="userSpaceOnUse">
          <circle cx="3.5" cy="3.5" r="1.4" fill="var(--ink)" />
        </pattern>
      </defs>
      <path
        d="M150 30 C205 10 262 38 270 92 C278 146 240 196 180 204 C120 212 70 180 64 126 C58 76 95 50 150 30 Z"
        fill="var(--riso-pink)"
        className="mul"
      />
      <circle cx="244" cy="152" r="60" fill="var(--riso-blue)" className="mul" />
      <circle cx="118" cy="92" r="34" fill="url(#riso-halftone-home)" opacity="0.45" />
      {/* The blob's outline, offset ~5px up and right from its fill. */}
      <path
        d="M155 25 C210 5 267 33 275 87 C283 141 245 191 185 199 C125 207 75 175 69 121 C63 71 100 45 155 25 Z"
        className="ln-thin"
      />
      <path d="M28 168 C58 124 96 206 140 156 C176 116 214 98 262 86" className="ln" />
      <path d="M306 34 L306 52 M297 43 L315 43" className="ln" />
      <path d="M40 58 L40 70 M34 64 L46 64" className="ln-thin" />
    </svg>
  );
}

/**
 * How wide the pink charge is, per result band. `drained` is the brief's
 * reference drawing (a square about a third of the way along); the others fill
 * more or less of the same battery, so the picture agrees with the words.
 */
const CHARGE: Record<ResultState, number> = { ok: 132, thinking: 96, drained: 52, heavy: 28 };

/**
 * Result (342×180): a battery. Blue blob, and a pink charge whose length tracks
 * the result. `chargeClassName` lets the caller animate it (§9: it grows with
 * scaleX over 450ms when the result appears).
 */
export function ResultBattery({
  state = 'drained',
  chargeClassName = '',
}: {
  state?: ResultState;
  chargeClassName?: string;
}) {
  return (
    <svg viewBox="0 0 342 180" aria-hidden="true" style={fluid}>
      <path
        d="M52 118 C48 72 96 36 148 46 C196 56 214 104 192 138 C170 172 56 164 52 118 Z"
        fill="var(--riso-blue)"
        className="mul"
      />
      <rect
        x="112"
        y="70"
        width={CHARGE[state]}
        height="52"
        rx="9"
        fill="var(--riso-pink)"
        className={`mul ${chargeClassName}`}
      />
      {/* Battery outline, offset from the fills. */}
      <rect x="104" y="60" width="164" height="74" rx="18" className="ln" />
      <rect x="268" y="84" width="14" height="26" rx="5" className="ln" />
      <path d="M292 50 L304 38 M298 66 L314 60" className="ln-thin" />
      <path d="M30 40 L30 52 M24 46 L36 46" className="ln-thin" />
    </svg>
  );
}

/* 12 outer petals in the accent colour, and 8 inner petals in pink at 55%
   opacity so the multiply blend turns the overlap orange (§6). */
const OUTER_PETALS: [number, number][] = [
  [229, 110],
  [221.2, 139],
  [200, 160.2],
  [171, 168],
  [142, 160.2],
  [120.8, 139],
  [113, 110],
  [120.8, 81],
  [142, 59.8],
  [171, 52],
  [200, 59.8],
  [221.2, 81],
];

const INNER_PETALS: [number, number][] = [
  [198.7, 121.5],
  [182.5, 137.7],
  [159.5, 137.7],
  [143.3, 121.5],
  [143.3, 98.5],
  [159.5, 82.3],
  [182.5, 82.3],
  [198.7, 98.5],
];

/**
 * Booth (342×240): a marigold — ดาวเรือง.
 *
 * `viewBox` lets a caller crop in. The phone screen wants the whole 342×240
 * drawing with its margins; the kiosk result sets the flower on a disc and crops
 * to the flower head, stem and leaf so it fills the disc instead of floating in
 * it.
 */
export function BoothMarigold({ viewBox = '0 0 342 240' }: { viewBox?: string }) {
  return (
    <svg viewBox={viewBox} aria-hidden="true" style={fluid}>
      {/* Leaf and stem sit behind the flower head. */}
      <path
        d="M172 196 C190 176 222 178 236 190 C216 206 190 210 172 196 Z"
        fill="var(--riso-blue)"
        className="mul"
      />
      <path d="M171 172 C166 192 178 208 170 236" className="ln" />

      {OUTER_PETALS.map(([cx, cy]) => (
        <circle key={`o-${cx}-${cy}`} cx={cx} cy={cy} r="22" fill="var(--accent)" className="mul" />
      ))}
      {INNER_PETALS.map(([cx, cy]) => (
        <circle
          key={`i-${cx}-${cy}`}
          cx={cx}
          cy={cy}
          r="20"
          fill="var(--riso-pink)"
          opacity="0.55"
          className="mul"
        />
      ))}

      <circle cx="176" cy="106" r="86" className="ln-dot" />
      <path d="M166 104 L166.1 104 M176 112 L176.1 112 M180 100 L180.1 100" className="ln" />
      <path d="M42 50 L42 64 M35 57 L49 57" className="ln-thin" />
      <path d="M300 186 L300 198 M294 192 L306 192" className="ln-thin" />
    </svg>
  );
}

/**
 * The 220px moon that sits partly off the booth screen's top-right corner, its
 * outline offset down-left. Positioned by the booth page's CSS module; the
 * screen container clips it.
 */
export function BoothMoon({ className }: { className?: string }) {
  return (
    <svg width="220" height="220" viewBox="0 0 220 220" aria-hidden="true" className={className}>
      <circle cx="110" cy="110" r="100" fill="var(--accent)" className="mul" />
      <circle cx="98" cy="120" r="100" className="ln-thin" />
    </svg>
  );
}
