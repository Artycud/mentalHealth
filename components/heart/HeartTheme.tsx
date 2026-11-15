import type { ReactNode } from 'react';

import styles from './HeartTheme.module.css';
import { Sky } from './Sky';

/**
 * Puts a student screen in the User Mode look: the time-of-day sky, with the
 * screen laid on it as a sheet of paper. Booth screens never use this; they keep
 * their festival.
 */
export function HeartTheme({ children }: { children: ReactNode }) {
  return (
    <div className={styles.theme} data-home="heart">
      <Sky />
      {children}
    </div>
  );
}
