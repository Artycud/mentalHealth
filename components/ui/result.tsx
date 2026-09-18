import { SuggestionMarker } from '@/components/illustrations/icons';
import { suggestionsHeading, type Suggestion } from '@/content/th/results';

import styles from './result.module.css';

/** Strongest topic filled, second topic outlined (BRIEF §7). */
export function TopicPills({ primary, secondary }: { primary: string; secondary: string }) {
  return (
    <div className={styles.pills}>
      <span className={`${styles.pill} ${styles.primary}`}>{primary}</span>
      <span className={`${styles.pill} ${styles.secondary}`}>{secondary}</span>
    </div>
  );
}

/** Three rows, each with a different riso marker. */
export function SuggestionList({ items }: { items: readonly Suggestion[] }) {
  return (
    <section className={styles.list}>
      <h2 className={styles.heading}>{suggestionsHeading}</h2>
      {items.map((item, i) => (
        <div key={item.title} className={styles.row}>
          <SuggestionMarker variant={(i % 3) as 0 | 1 | 2} />
          <div className={styles.rowText}>
            <span className={styles.rowTitle}>{item.title}</span>
            <span className={styles.rowBody}>{item.body}</span>
          </div>
        </div>
      ))}
    </section>
  );
}
