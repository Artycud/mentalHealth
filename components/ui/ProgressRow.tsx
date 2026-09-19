import Link from 'next/link';

import { BackChevron } from '@/components/illustrations/icons';
import { common } from '@/content/th/common';

import styles from './ProgressRow.module.css';

interface ProgressRowProps {
  /** 1-based index of the current question. */
  current: number;
  total: number;
  /** Where back goes when it is a plain link (a static screen). */
  backHref?: string;
  /** Back as an action instead, for a flow that steps through history. */
  onBack?: () => void;
}

/**
 * Back chevron, one segment per question, and a counter (BRIEF §7).
 * Done segments are ink, the current one riso-pink, upcoming ones track.
 */
export function ProgressRow({ current, total, backHref, onBack }: ProgressRowProps) {
  return (
    <div className={styles.row}>
      {onBack ? (
        <button type="button" aria-label={common.actions.back} className={styles.back} onClick={onBack}>
          <BackChevron />
        </button>
      ) : (
        <Link href={backHref ?? '/'} aria-label={common.actions.back} className={styles.back}>
          <BackChevron />
        </Link>
      )}

      {/* The counter carries the meaning; the segments are decoration. */}
      <div className={styles.segments} aria-hidden="true">
        {Array.from({ length: total }, (_, i) => {
          const n = i + 1;
          const state = n < current ? styles.done : n === current ? styles.current : '';
          return <div key={n} className={`${styles.segment} ${state}`} />;
        })}
      </div>

      <span className={styles.counter}>
        {current}/{total}
      </span>
    </div>
  );
}
