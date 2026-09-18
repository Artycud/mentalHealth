import type { ReactNode } from 'react';

import styles from './Screen.module.css';

/** Top padding is 16–20px depending on the screen (BRIEF §6). */
export function Screen({ children, top = 20 }: { children: ReactNode; top?: 16 | 20 }) {
  return (
    <main className={styles.screen} style={{ paddingTop: top }}>
      {children}
    </main>
  );
}
