import type { ReactNode } from 'react';
import Link from 'next/link';

import styles from './buttons.module.css';

type ActionProps = {
  href: string;
  children: ReactNode;
  className?: string;
};

/**
 * Full-width ink button (BRIEF §7).
 *
 * The white text colour is set inline on purpose: `a:hover` in globals.css
 * turns links note-pink, which on an ink fill would be close to unreadable.
 * An inline style outranks it whatever else is loaded.
 */
export function PrimaryButton({ href, children }: ActionProps) {
  return (
    <Link href={href} className={`${styles.base} ${styles.primary}`} style={{ color: 'var(--white)' }}>
      {children}
    </Link>
  );
}

/**
 * The same button as PrimaryButton, but an action rather than a link. It shows
 * as disabled (paper-grey, not removed) until there is something to submit, so
 * the layout never jumps when it becomes available.
 */
export function PrimaryAction({
  children,
  onClick,
  disabled = false,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-disabled={disabled}
      onClick={() => {
        if (!disabled) onClick();
      }}
      className={`${styles.base} ${styles.primary} ${disabled ? styles.disabled : ''}`}
      style={{ color: disabled ? 'var(--ink-muted)' : 'var(--white)' }}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({ href, children }: ActionProps) {
  return (
    <Link href={href} className={`${styles.base} ${styles.secondary}`} style={{ color: 'var(--ink)' }}>
      {children}
    </Link>
  );
}

/** Left-aligned pill. `body` switches it to the body face for the CUD Care block. */
export function PillLink({
  href,
  children,
  body = false,
}: ActionProps & { body?: boolean }) {
  return (
    <Link
      href={href}
      className={`${styles.base} ${styles.pill} ${body ? styles.pillBody : ''}`}
      style={{ color: 'var(--ink)' }}
    >
      {children}
    </Link>
  );
}

export function TextLink({ href, children }: ActionProps) {
  return (
    <Link href={href} className={styles.textLink}>
      {children}
    </Link>
  );
}
