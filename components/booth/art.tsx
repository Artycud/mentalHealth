import { circlePath, Cut, PAPER_SHADOW, SpeckleDefs } from '@/components/illustrations/paper';
import type { Tint } from '@/lib/types';

import s from './art.module.css';

/**
 * Illustrations for the booth kiosk and TV.
 *
 * The base identity's hand-cut paper (see components/illustrations/paper.tsx):
 * pieces of coloured paper with a soft edge beneath, inks that still multiply into a
 * third colour where they overlap, and a hand-drawn water line. Every scene is a
 * different composition; nothing is reused verbatim. Motion is in art.module.css.
 *
 * Nothing here belongs to a festival. The scenes a festival owns live under
 * components/festival/.
 */

const BLOB =
  'M150 30 C205 10 262 38 270 92 C278 146 240 196 180 204 C120 212 70 180 64 126 C58 76 95 50 150 30 Z';

/** Kiosk idle: soft shapes and a water line behind the big marigold. */
export function IdleBackdrop() {
  return (
    <svg viewBox="0 0 520 460" aria-hidden="true" className={s.fill}>
      <SpeckleDefs id="sp-idle" size={110} />
      <g className={s.floatA}>
        <Cut d={BLOB} fill="var(--riso-pink)" speckle="sp-idle" transform="translate(505 74) scale(-1.4 1.4)" />
      </g>
      <g className={s.floatB}>
        <Cut d={circlePath(410, 356, 80)} fill="var(--riso-blue)" speckle="sp-idle" mul />
      </g>
      <g className={s.floatC}>
        <path d="M14 414 C80 354 160 456 244 400 C318 350 378 370 460 328" className="ln" />
      </g>
    </svg>
  );
}

/**
 * One illustration per question, each a different composition:
 *  0  a sunrise: pink sun, blue moon still up, a horizon line
 *  1  three overlapping coins: the multiply blend doing what it does best
 *  2  an evening out: a moon, a string of lanterns, water
 */
export function QuizArt({ step }: { step: number }) {
  return (
    <svg viewBox="0 0 400 240" aria-hidden="true" className={s.fill}>
      <SpeckleDefs id={`sp-q${step}`} size={90} />
      {step === 0 && (
        <>
          <g className={s.floatA}>
            <Cut d={circlePath(150, 128, 84)} fill="var(--riso-pink)" speckle="sp-q0" />
          </g>
          <g className={s.floatB}>
            <Cut d={circlePath(262, 104, 56)} fill="var(--riso-blue)" speckle="sp-q0" mul />
          </g>
          <path d="M8 204 C70 180 130 228 200 202 C270 176 330 222 392 194" className="ln" />
        </>
      )}
      {step === 1 && (
        <>
          <g className={s.floatA}>
            <Cut d={circlePath(150, 112, 64)} fill="var(--riso-pink)" speckle="sp-q1" />
          </g>
          <g className={s.floatB}>
            <Cut d={circlePath(222, 112, 64)} fill="var(--accent)" speckle="sp-q1" mul shadow={false} />
          </g>
          <g className={s.floatC}>
            <Cut d={circlePath(186, 170, 64)} fill="var(--riso-blue)" speckle="sp-q1" mul shadow={false} />
          </g>
        </>
      )}
      {step === 2 && (
        <>
          <g className={s.floatA}>
            <Cut d={circlePath(300, 96, 62)} fill="var(--accent)" speckle="sp-q2" />
          </g>
          {/* A string of lanterns. */}
          <path d="M14 56 C90 100 170 44 250 90" className="ln-thin" />
          <g className={s.floatB}>
            <rect x="62" y="84" width="24" height="32" rx="9" fill="var(--riso-pink)" className="mul" />
            <rect x="126" y="80" width="24" height="32" rx="9" fill="var(--riso-blue)" className="mul" />
            <rect x="190" y="76" width="24" height="32" rx="9" fill="var(--riso-pink)" className="mul" />
          </g>
          <path d="M8 208 C70 184 130 232 200 206 C270 180 330 226 392 198" className="ln" />
        </>
      )}
    </svg>
  );
}

/**
 * Behind the result flower. A flat paper-cut disc (no multiply, so the flower on top
 * keeps its own colours) with its paper edge, and two small pieces of ink. `tone` is
 * chosen so the disc never matches the flower's own colour.
 */
export function ResultBackdrop({ tone }: { tone: 'pink' | 'sun' }) {
  return (
    <svg viewBox="0 0 400 400" aria-hidden="true" className={s.fill}>
      <SpeckleDefs id="sp-result" size={90} />
      <circle cx="205" cy="208" r="172" fill={PAPER_SHADOW} />
      <circle cx="200" cy="200" r="172" fill={tone === 'pink' ? 'var(--pink-tint)' : 'var(--sun-tint)'} />
      <g className={s.floatA}>
        <Cut d={circlePath(346, 70, 26)} fill="var(--riso-blue)" speckle="sp-result" mul />
      </g>
      <g className={s.floatB}>
        <Cut d={circlePath(54, 336, 18)} fill="var(--riso-pink)" speckle="sp-result" mul />
      </g>
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
      <SpeckleDefs id="sp-count" size={110} />
      <g className={s.floatA}>
        <Cut d={BLOB} fill="var(--riso-pink)" speckle="sp-count" transform="translate(10 8) scale(1.05 1.05)" />
      </g>
      <g className={s.floatB}>
        <Cut d={circlePath(258, 204, 40)} fill="var(--riso-blue)" speckle="sp-count" mul />
      </g>
    </svg>
  );
}
