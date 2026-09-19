import type { ChoiceMark as Mark } from '@/lib/types';

/**
 * The picture beside a booth answer.
 *
 * Same riso construction as the rest of the product — a multiplied fill with a
 * thin ink outline offset from it, as if the print slipped (BRIEF §6) — but
 * NOT the check-in's moon phases. Those run full → empty and so read as
 * "better to worse", which is wrong for a game where no answer is better. A
 * shape here means nothing; a swatch means exactly the colour it shows, for the
 * one question that asks about colour.
 *
 * Decorative: the answer's own text carries the meaning, so it is aria-hidden.
 */

const SWATCH: Record<'pink' | 'blue' | 'yellow' | 'navy', string> = {
  pink: 'var(--riso-pink)',
  blue: 'var(--riso-blue)',
  yellow: 'var(--accent)',
  navy: 'var(--ink)',
};

export function ChoiceMark({ mark }: { mark: Mark }) {
  const isSwatch = mark in SWATCH;

  return (
    <svg width="48" height="48" viewBox="0 0 32 32" aria-hidden="true" style={{ flexShrink: 0 }}>
      {isSwatch && (
        <>
          <circle
            cx="17"
            cy="15"
            r="11"
            fill={SWATCH[mark as keyof typeof SWATCH]}
            className={mark === 'navy' ? undefined : 'mul'}
          />
          <circle cx="15" cy="17" r="11" className="ln-thin" />
        </>
      )}
      {mark === 'circle' && (
        <>
          <circle cx="17" cy="15" r="11" fill="var(--riso-blue)" className="mul" />
          <circle cx="15" cy="17" r="11" className="ln-thin" />
        </>
      )}
      {mark === 'square' && (
        <>
          <rect x="7" y="4" width="20" height="20" rx="6" fill="var(--riso-pink)" className="mul" />
          <rect x="5" y="7" width="20" height="20" rx="6" className="ln-thin" />
        </>
      )}
      {mark === 'leaf' && (
        <>
          <path d="M8 25 C8 12 15 5 28 5 C28 18 21 25 8 25 Z" fill="var(--riso-blue)" className="mul" />
          <path d="M5 28 C5 15 12 8 25 8 C25 21 18 28 5 28 Z" className="ln-thin" />
        </>
      )}
      {mark === 'drop' && (
        <>
          <path
            d="M17 3 C23 11 27 15 27 20 A10 10 0 0 1 7 20 C7 15 11 11 17 3 Z"
            fill="var(--riso-pink)"
            className="mul"
          />
          <path
            d="M15 6 C21 14 25 18 25 23 A10 10 0 0 1 5 23 C5 18 9 14 15 6 Z"
            className="ln-thin"
          />
        </>
      )}
    </svg>
  );
}
