import type { ReactNode } from 'react';

import type { FestivalId } from '@/lib/types';

import styles from './Screen.module.css';

/**
 * Top padding is 16–20px depending on the screen (BRIEF §6).
 *
 * `festival` puts a festival's colours in reach of everything inside. Leave it out
 * for the private screens (check-in, result): they carry the base identity only.
 */
export function Screen({
  children,
  top = 20,
  festival,
}: {
  children: ReactNode;
  top?: 16 | 20;
  festival?: FestivalId;
}) {
  return (
    <main className={styles.screen} style={{ paddingTop: top }} data-festival={festival}>
      {children}
    </main>
  );
}
