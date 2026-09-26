import type { ReactNode } from 'react';

import styles from './HeartTheme.module.css';

/**
 * Puts a student screen in the User Mode look: the light sky, and the base
 * tokens redefined to the home's pinks. Booth screens never use this; they keep
 * the paper identity and their festival.
 */
export function HeartTheme({ children }: { children: ReactNode }) {
  return (
    <div className={styles.theme} data-home="heart">
      <div className={styles.sky} aria-hidden="true" />
      <div className={styles.grain} aria-hidden="true" />
      {children}
    </div>
  );
}
