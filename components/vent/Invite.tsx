import { Fragment } from 'react';

import { vent } from '@/content/th/vent';
import { SKY_TIMES } from '@/lib/sky-time';

import styles from './Invite.module.css';

/**
 * The pieces that invite a student to write, shared by the home's VENT bar
 * (components/landing/VentStart) and an empty chat (components/vent/Vent).
 * No state here: whatever moves is CSS, and the mood is the sky's.
 */

/** The heart's question for this time of day. All four are in the page; the
    sky's mood (data-time on <html>) shows one, so it never flashes from one to
    another as the page loads. */
export function TimeAsk({ className }: { className?: string }) {
  return (
    <span className={className}>
      {SKY_TIMES.map((t) => (
        <span key={t} className={styles.ask} data-for={t}>
          {/* Thai has no spaces between words, only between phrases, and a browser
              may break a line inside a phrase (หรือ / เปล่า). Keep each phrase whole. */}
          {vent.invite.ask[t].split(' ').map((phrase, i) => (
            <Fragment key={i}>
              {/* the space stays outside, where the line may break */}
              {i > 0 && ' '}
              <span className={styles.phrase}>{phrase}</span>
            </Fragment>
          ))}
        </span>
      ))}
    </span>
  );
}

/** Starters drifting through an empty bar, one after another. Put it straight
    after an <input placeholder=" ">: it hides itself once anything is written. */
export function DriftingHints() {
  return (
    <span className={styles.hints} aria-hidden="true">
      {vent.invite.hints.map((h, i) => (
        <span key={h} style={{ animationDelay: `${i * 2.6}s` }}>
          {h}
        </span>
      ))}
    </span>
  );
}

/** Things to start with, sent with one tap. */
export function Starters({
  onPick,
  disabled = false,
  row = false,
  className = '',
}: {
  onPick: (text: string) => void;
  disabled?: boolean;
  /** One line that scrolls sideways, where height is precious (the home). */
  row?: boolean;
  className?: string;
}) {
  return (
    <div className={`${styles.starters} ${row ? styles.row : ''} ${className}`}>
      {vent.invite.starters.map((s) => (
        <button key={s} type="button" className={styles.starter} data-press disabled={disabled} onClick={() => onPick(s)}>
          {s}
        </button>
      ))}
    </div>
  );
}

/** Who answers, beside the button where the doubt is. A speech bubble, not a
    lock: a lock reads as something you are not allowed into yet. */
export function SafeLine({ className }: { className?: string }) {
  return (
    <p className={`${styles.safe} ${className ?? ''}`}>
      <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
        <path d="M2 2.5 h10 a1.5 1.5 0 0 1 1.5 1.5 v5 a1.5 1.5 0 0 1 -1.5 1.5 H6 l-3 2.5 v-2.5 H2 a1.5 1.5 0 0 1 -1.5 -1.5 V4 A1.5 1.5 0 0 1 2 2.5 Z" fill="currentColor" />
        <circle cx="4.5" cy="6.5" r="0.9" fill="var(--card, #fff)" />
        <circle cx="7" cy="6.5" r="0.9" fill="var(--card, #fff)" />
        <circle cx="9.5" cy="6.5" r="0.9" fill="var(--card, #fff)" />
      </svg>
      {vent.invite.safe}
    </p>
  );
}

/** How fast a พี่ answers at best, in the chat. */
export function SpeedLine({ className }: { className?: string }) {
  return (
    <p className={`${styles.speed} ${className ?? ''}`}>
      <svg width="13" height="13" viewBox="0 0 14 14" aria-hidden="true">
        <path d="M8.5 1 L3 8 H6.5 L5.5 13 L11 6 H7.5 Z" fill="currentColor" />
      </svg>
      {vent.intro.speed}
    </p>
  );
}

/** The send button's paper airplane. */
export function Plane() {
  return (
    <svg width="20" height="20" viewBox="0 0 22 22" aria-hidden="true">
      <path d="M2.5 10.5 L19.5 3 L13 19.5 L10.5 12.5 Z" fill="currentColor" />
      <path d="M10.5 12.5 L19.5 3" stroke="var(--button, #1b2b5e)" strokeWidth="1.4" />
    </svg>
  );
}
