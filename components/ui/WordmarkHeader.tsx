import { Wordmark } from '@/components/illustrations/icons';
import { common } from '@/content/th/common';

import styles from './WordmarkHeader.module.css';

/** The two-circle mark, a 10px gap, then the campaign name (BRIEF §7). */
export function WordmarkHeader({ note }: { note?: string }) {
  const brand = (
    <>
      <Wordmark />
      <span className={styles.name}>{common.wordmark}</span>
    </>
  );

  // With a note (the result screen) the brand and note sit at opposite ends.
  if (note) {
    return (
      <header className={`${styles.header} ${styles.spread}`}>
        <div className={styles.brand}>{brand}</div>
        <span className={styles.note}>{note}</span>
      </header>
    );
  }

  return <header className={styles.header}>{brand}</header>;
}
