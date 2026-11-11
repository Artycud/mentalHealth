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
 *  3  the honest question: a smiling paper face held up, the real colour behind it
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
      {step === 3 && (
        <>
          {/* The honest question: a smiling paper face held up in front, and the
              real colour of the day peeking out from behind it. */}
          <g className={s.floatB}>
            <Cut d={circlePath(236, 118, 78)} fill="var(--riso-blue)" speckle="sp-q3" />
          </g>
          <g className={s.floatA}>
            <Cut d={circlePath(170, 126, 74)} fill="var(--paper-raised)" speckle="sp-q3" />
            <circle cx="146" cy="112" r="6" fill="var(--ink)" />
            <circle cx="194" cy="112" r="6" fill="var(--ink)" />
            <path d="M138 142 C156 164 186 164 204 142" className="ln" />
            {/* The stick it is held up by. */}
            <path d="M170 200 L170 236" className="ln" />
          </g>
          <g className={s.floatC}>
            <Cut d={circlePath(300, 66, 16)} fill="var(--riso-pink)" speckle="sp-q3" mul shadow={false} />
          </g>
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

/** The cone's waffle: diagonal lines both ways, clipped to the cone. */
const WAFFLE = [-40, 0, 40, 80, 120, 160].flatMap((o) => [
  `M${o} 150 L${o + 160} 310`,
  `M${o + 120} 150 L${o - 40} 310`,
]);

/**
 * The TV's reward, as a picture: an ice-cream cone in cut paper. A shape the room
 * knows before it reads a word, beside the coupon's amount. A vanilla scoop on a
 * pink one, a marigold cone, a cherry. Still: the amount beside it is what pops.
 */
export function IceCream() {
  return (
    <svg viewBox="0 0 220 320" aria-hidden="true" className={s.fill}>
      <SpeckleDefs id="sp-ice" size={110} />
      <defs>
        <clipPath id="ice-cone">
          <path d="M50 150 L170 150 L112 314 Z" />
        </clipPath>
      </defs>
      <Cut d="M50 150 L170 150 L112 314 Z" fill="var(--sunflower)" speckle="sp-ice" />
      <g clipPath="url(#ice-cone)" stroke="var(--ink)" strokeWidth="4" opacity="0.32">
        {WAFFLE.map((d) => (
          <path key={d} d={d} />
        ))}
      </g>
      <Cut
        d="M38 156 C28 116 62 90 110 90 C158 90 192 116 182 156 C176 172 162 160 152 174 C142 188 130 166 119 178 C108 190 96 166 85 178 C74 190 62 162 52 172 C44 178 38 168 38 156 Z"
        fill="var(--riso-pink)"
        speckle="sp-ice"
      />
      <Cut d={circlePath(110, 78, 46)} fill="var(--paper)" speckle="sp-ice" />
      <g strokeLinecap="round" strokeWidth="5">
        <path d="M86 64 l8 -5" stroke="var(--riso-blue)" />
        <path d="M118 96 l9 3" stroke="var(--riso-pink)" />
        <path d="M134 62 l4 8" stroke="var(--riso-blue)" />
        <path d="M96 92 l-6 6" stroke="var(--sunflower)" />
      </g>
      <path d="M124 26 C126 14 134 8 144 6" fill="none" stroke="var(--ink)" strokeWidth="4" strokeLinecap="round" />
      <Cut d={circlePath(122, 34, 12)} fill="var(--riso-pink)" />
    </svg>
  );
}
