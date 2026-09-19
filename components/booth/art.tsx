import type { Tint } from '@/lib/types';

import s from './art.module.css';

/**
 * Illustrations for the booth kiosk and TV.
 *
 * Riso-zine language throughout (BRIEF §6): multiplied fills that make a third
 * colour where they overlap, a thin ink outline offset from its fill, a halftone
 * patch, hand strokes, "+" sparkles. Every scene is a different composition —
 * nothing is reused verbatim. Motion is in art.module.css.
 *
 * Paths for the blob are copied from the phone home scene, mirrored, so the
 * booth reads as the same family without repeating it.
 */

const BLOB =
  'M150 30 C205 10 262 38 270 92 C278 146 240 196 180 204 C120 212 70 180 64 126 C58 76 95 50 150 30 Z';

/** Two thin strokes crossed: a riso "+". */
function Plus({ x, y, r = 11, thin = false, cls = '' }: { x: number; y: number; r?: number; thin?: boolean; cls?: string }) {
  return (
    <path
      d={`M${x} ${y - r} L${x} ${y + r} M${x - r} ${y} L${x + r} ${y}`}
      className={`${thin ? 'ln-thin' : 'ln'} ${s.twinkle} ${cls}`}
    />
  );
}

/** A 7px halftone grid with 1.4px ink dots at 45% (§6). Unique id per scene. */
function Halftone({ id }: { id: string }) {
  return (
    <defs>
      <pattern id={id} width="7" height="7" patternUnits="userSpaceOnUse">
        <circle cx="3.5" cy="3.5" r="1.4" fill="var(--ink)" />
      </pattern>
    </defs>
  );
}

/** Kiosk idle: blobs and water behind the big marigold. */
export function IdleBackdrop() {
  return (
    <svg viewBox="0 0 520 460" aria-hidden="true" className={s.fill}>
      <Halftone id="ht-idle" />
      <g className={s.floatA}>
        <path transform="translate(505 74) scale(-1.4 1.4)" d={BLOB} fill="var(--riso-pink)" className="mul" />
        {/* The blob's outline, offset up and to the right: the print slipped. */}
        <path transform="translate(512 66) scale(-1.4 1.4)" d={BLOB} className="ln-thin" />
      </g>
      <g className={s.floatB}>
        <circle cx="410" cy="356" r="80" fill="var(--riso-blue)" className="mul" />
      </g>
      <circle cx="118" cy="140" r="46" fill="url(#ht-idle)" opacity="0.45" />
      <g className={s.floatC}>
        <path d="M14 414 C80 354 160 456 244 400 C318 350 378 370 460 328" className="ln" />
      </g>
      <Plus x={62} y={70} r={12} />
      <Plus x={468} y={52} r={9} thin cls={s.twinkleB} />
      <Plus x={40} y={330} r={8} thin cls={s.twinkleC} />
    </svg>
  );
}

/**
 * One illustration per question, each a different composition:
 *  0  a sunrise — pink sun, blue moon still up, a horizon line
 *  1  three overlapping coins — the multiply blend doing what it does best
 *  2  an evening out — a moon, a string of lanterns, water
 */
export function QuizArt({ step }: { step: number }) {
  return (
    <svg viewBox="0 0 400 240" aria-hidden="true" className={s.fill}>
      <Halftone id={`ht-q${step}`} />
      {step === 0 && (
        <>
          <g className={s.floatA}>
            <circle cx="150" cy="128" r="84" fill="var(--riso-pink)" className="mul" />
            <circle cx="143" cy="135" r="84" className="ln-thin" />
          </g>
          <g className={s.floatB}>
            <circle cx="262" cy="104" r="56" fill="var(--riso-blue)" className="mul" />
          </g>
          <circle cx="86" cy="64" r="26" fill="url(#ht-q0)" opacity="0.45" />
          <path d="M8 204 C70 180 130 228 200 202 C270 176 330 222 392 194" className="ln" />
          <Plus x={340} y={44} r={11} />
          <Plus x={30} y={150} r={8} thin cls={s.twinkleB} />
        </>
      )}
      {step === 1 && (
        <>
          <g className={s.floatA}>
            <circle cx="150" cy="112" r="64" fill="var(--riso-pink)" className="mul" />
            <circle cx="143" cy="119" r="64" className="ln-thin" />
          </g>
          <g className={s.floatB}>
            <circle cx="222" cy="112" r="64" fill="var(--accent)" className="mul" />
          </g>
          <g className={s.floatC}>
            <circle cx="186" cy="170" r="64" fill="var(--riso-blue)" className="mul" />
          </g>
          <circle cx="330" cy="70" r="24" fill="url(#ht-q1)" opacity="0.45" />
          <Plus x={340} y={190} r={11} />
          <Plus x={44} y={44} r={9} thin cls={s.twinkleB} />
        </>
      )}
      {step === 2 && (
        <>
          <g className={s.floatA}>
            <circle cx="300" cy="96" r="62" fill="var(--accent)" className="mul" />
            <circle cx="292" cy="104" r="62" className="ln-thin" />
          </g>
          {/* A string of lanterns. */}
          <path d="M14 56 C90 100 170 44 250 90" className="ln-thin" />
          <g className={s.floatB}>
            <rect x="62" y="84" width="24" height="32" rx="9" fill="var(--riso-pink)" className="mul" />
            <rect x="126" y="80" width="24" height="32" rx="9" fill="var(--riso-blue)" className="mul" />
            <rect x="190" y="76" width="24" height="32" rx="9" fill="var(--riso-pink)" className="mul" />
          </g>
          <path d="M8 208 C70 184 130 232 200 206 C270 180 330 226 392 198" className="ln" />
          <Plus x={350} y={200} r={10} thin cls={s.twinkleB} />
          <Plus x={30} y={150} r={9} />
        </>
      )}
    </svg>
  );
}

/**
 * Behind the result flower. A flat paper-cut disc (no multiply, so the flower
 * on top keeps its own colours), a misregistered outline, and a few small inks.
 * `tone` is chosen so the disc never matches the flower's own colour.
 */
export function ResultBackdrop({ tone }: { tone: 'pink' | 'sun' }) {
  return (
    <svg viewBox="0 0 400 400" aria-hidden="true" className={s.fill}>
      <Halftone id="ht-result" />
      <circle cx="200" cy="200" r="172" fill={tone === 'pink' ? 'var(--pink-tint)' : 'var(--sun-tint)'} />
      <circle cx="191" cy="209" r="172" className="ln-thin" />
      <g className={s.floatA}>
        <circle cx="346" cy="70" r="26" fill="var(--riso-blue)" className="mul" />
      </g>
      <g className={s.floatB}>
        <circle cx="54" cy="336" r="18" fill="var(--riso-pink)" className="mul" />
      </g>
      <circle cx="322" cy="332" r="42" fill="url(#ht-result)" opacity="0.45" />
      <Plus x={52} y={78} r={11} />
      <Plus x={358} y={196} r={8} thin cls={s.twinkleB} />
      <Plus x={90} y={360} r={7} thin cls={s.twinkleC} />
    </svg>
  );
}

/** Which backdrop tone suits a flower: never the flower's own outer ink. */
export function backdropToneFor(tint: Tint): 'pink' | 'sun' {
  // Tints 0 and 4 have a yellow outer, so they sit on pink. Tints 1 and 3 have a
  // pink outer, so they sit on yellow. Tints 2 and 5 have a blue outer, which
  // reads well on either; pink is warmer.
  return tint === 1 || tint === 3 ? 'sun' : 'pink';
}

/**
 * The count's badge on the TV: a pink blob and a blue circle for the big number
 * to sit on. The number itself is HTML, laid over this.
 */
export function CountBlob() {
  return (
    <svg viewBox="0 0 300 250" aria-hidden="true" className={s.fill}>
      <Halftone id="ht-count" />
      <g className={s.floatA}>
        <path transform="translate(10 8) scale(1.05 1.05)" d={BLOB} fill="var(--riso-pink)" className="mul" />
        <path transform="translate(4 2) scale(1.05 1.05)" d={BLOB} className="ln-thin" />
      </g>
      <g className={s.floatB}>
        <circle cx="258" cy="204" r="40" fill="var(--riso-blue)" className="mul" />
      </g>
      <circle cx="60" cy="196" r="28" fill="url(#ht-count)" opacity="0.45" />
      <Plus x={262} y={40} r={10} />
    </svg>
  );
}

/**
 * Animated water for the TV's river. Two waves of different amplitude, speed and
 * direction so the surface never repeats in step. Each path is drawn 1650 units
 * wide with a 300-unit period, and slid by exactly one period, so it loops
 * without a seam.
 */
const WAVE_A = `M0 60 q75 -30 150 0 ${'t150 0 '.repeat(10)}`;
const WAVE_B = `M0 92 q75 18 150 0 ${'t150 0 '.repeat(10)}`;

export function Waves() {
  return (
    <svg viewBox="0 0 1200 120" preserveAspectRatio="none" aria-hidden="true" className={s.fill}>
      <g className={s.waveA}>
        <path d={WAVE_A} className="ln" />
      </g>
      <g className={s.waveB}>
        <path d={WAVE_B} className="ln-thin" />
      </g>
    </svg>
  );
}
