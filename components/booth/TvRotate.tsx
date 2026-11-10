'use client';

import { useEffect, useState } from 'react';

import styles from './TvRotate.module.css';

/**
 * Takes turns in one place on the TV: the `primary` view (the flower bars), then
 * the next of `items` (the awareness slides), then the primary again, and so on.
 *
 * All the slides are rendered on the server and stacked in one grid cell; this only
 * says which one is showing, so a refresh never rebuilds what is on screen and the
 * cell never changes size. The swap is a cross-fade, and under reduced motion it is
 * an instant change (a new slide is content, not movement).
 *
 * The count of how many slides there are can change between refreshes (the
 * awareness total appears once there are enough answers); the position just wraps.
 */
export function TvRotate({
  primary,
  items,
  primaryMs = 14_000,
  itemMs = 12_000,
}: {
  primary: React.ReactNode;
  items: React.ReactNode[];
  primaryMs?: number;
  itemMs?: number;
}) {
  /** -1 while the primary shows; otherwise which item, counting up forever. */
  const [showing, setShowing] = useState(-1);
  const [nextItem, setNextItem] = useState(0);
  const hasItems = items.length > 0;

  useEffect(() => {
    if (!hasItems) return;
    const timer = setTimeout(
      () => {
        if (showing === -1) {
          setShowing(nextItem);
          setNextItem((n) => n + 1);
        } else {
          setShowing(-1);
        }
      },
      showing === -1 ? primaryMs : itemMs,
    );
    return () => clearTimeout(timer);
  }, [showing, nextItem, hasItems, primaryMs, itemMs]);

  const current = showing === -1 || !hasItems ? -1 : showing % items.length;

  return (
    <div className={styles.cell}>
      <div className={styles.slide} data-on={current === -1} aria-hidden={current !== -1}>
        {primary}
      </div>
      {items.map((item, i) => (
        <div key={i} className={styles.slide} data-on={current === i} aria-hidden={current !== i}>
          {item}
        </div>
      ))}
    </div>
  );
}
