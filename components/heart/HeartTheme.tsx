import type { ReactNode } from 'react';

import styles from './HeartTheme.module.css';
import { Sky } from './Sky';

/**
 * Puts a student screen in the User Mode look: the light sky, and the base
 * tokens redefined to the home's pinks. Booth screens never use this; they keep
 * the paper identity and their festival.
 */
export function HeartTheme({ children }: { children: ReactNode }) {
  return (
    <div className={styles.theme} data-home="heart">
      <Sky />
      {children}
    </div>
  );
}
