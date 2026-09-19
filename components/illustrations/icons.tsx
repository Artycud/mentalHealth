/**
 * Small inline-SVG icons. Path data copied verbatim from
 * reference/screens.html — the offsets are deliberate misregistration, not
 * mistakes (BRIEF §9).
 *
 * Every icon here is decorative, so each carries aria-hidden. Where an icon is
 * the only content of a control, the control itself gets the aria-label (§13).
 *
 * Stroke widths come from the .ln / .ln-thin classes in globals.css and stay on
 * the 2.5 / 1.5 system at every size — these icons are never scaled (§9).
 */

import type { AnswerIcon as AnswerIconVariant } from '@/lib/types';

/** Two overlapping inks, multiplied into a third colour. The campaign mark. */
export function Wordmark() {
  return (
    <svg width="28" height="20" viewBox="0 0 28 20" aria-hidden="true">
      <circle cx="10" cy="10" r="8" fill="var(--riso-pink)" className="mul" />
      <circle cx="18" cy="10" r="8" fill="var(--riso-blue)" className="mul" />
    </svg>
  );
}

/** Moon phases: how much of the moon is filled tracks the answer's weight. */
export function AnswerIcon({ variant }: { variant: AnswerIconVariant }) {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" aria-hidden="true" style={{ flexShrink: 0 }}>
      {variant === 'full' && (
        <>
          <circle cx="17" cy="15" r="11" fill="var(--riso-blue)" className="mul" />
          <circle cx="15" cy="17" r="11" className="ln-thin" />
        </>
      )}
      {variant === 'half' && (
        <>
          <path d="M17 4 A11 11 0 0 1 17 26 Z" fill="var(--riso-blue)" className="mul" />
          <circle cx="15" cy="16" r="11" className="ln-thin" />
        </>
      )}
      {variant === 'crescent' && (
        <>
          <path d="M17 4 A11 11 0 0 1 17 26 A6 11 0 0 0 17 4 Z" fill="var(--riso-blue)" className="mul" />
          <circle cx="15" cy="16" r="11" className="ln-thin" />
        </>
      )}
      {variant === 'empty' && (
        <>
          <circle cx="15" cy="16" r="11" className="ln-thin" />
          <path d="M9 17 C11 13 13 21 15.5 17 C18 13 20 21 22 17" className="ln-thin" />
        </>
      )}
    </svg>
  );
}

/** Shown on a selected answer card. Its space is always reserved (§9). */
export function CheckBadge() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" style={{ flexShrink: 0 }}>
      <circle cx="12" cy="12" r="11" fill="var(--ink)" />
      <path d="M7 12.5 L10.5 16 L17 9" className="ck" />
    </svg>
  );
}

/** Lives inside a 44px target, per the hit-area rule (§9). */
export function BackChevron() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M15 5 L8 12 L15 19" className="ln" />
    </svg>
  );
}

export function SpeechBubble() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" aria-hidden="true" style={{ flexShrink: 0 }}>
      <path
        d="M6 9 C6 6 8 4 11 4 L27 4 C30 4 32 6 32 9 L32 20 C32 23 30 25 27 25 L16 25 L9 31 L10 25 C7 25 6 23 6 20 Z"
        className="ln"
      />
      <path d="M13 14.5 L13.1 14.5 M19 14.5 L19.1 14.5 M25 14.5 L25.1 14.5" className="ln" />
    </svg>
  );
}

export function LocationPin() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" style={{ flexShrink: 0 }}>
      <path d="M9 16 C9 16 3.5 10.5 3.5 7 A5.5 5.5 0 0 1 14.5 7 C14.5 10.5 9 16 9 16 Z" className="ln-thin" />
      <circle cx="9" cy="7" r="1.8" className="ln-thin" />
    </svg>
  );
}

/** One per suggestion row, and each row gets a different one (§7). */
export function SuggestionMarker({
  variant,
  size = 18,
  style,
}: {
  variant: 0 | 1 | 2;
  /** Pixels. The viewBox scales, so the drawing stays intact at any size. */
  size?: number;
  /** Merged over the defaults, e.g. to drop the baseline nudge. */
  style?: React.CSSProperties;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 18 18"
      aria-hidden="true"
      style={{ flexShrink: 0, marginTop: 5, ...style }}
    >
      {variant === 0 && <circle cx="9" cy="9" r="7" fill="var(--riso-pink)" className="mul" />}
      {variant === 1 && (
        <rect x="2" y="3" width="14" height="12" rx="5" fill="var(--riso-blue)" className="mul" />
      )}
      {variant === 2 && (
        <>
          <path d="M9 2 A7 7 0 0 1 9 16 A4 7 0 0 0 9 2 Z" fill="var(--riso-pink)" className="mul" />
          <circle cx="8" cy="9" r="7" className="ln-thin" />
        </>
      )}
    </svg>
  );
}
