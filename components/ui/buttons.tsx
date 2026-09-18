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
