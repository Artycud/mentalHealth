'use client';

import { useEffect, useRef, useState } from 'react';

import palette from '@/components/heart/palette.module.css';
import { haptic } from '@/lib/haptics';

import styles from './Landing.module.css';

export interface RoundCard {
  id: string;
  name: string;
  date: string;
  theme: string;
  state: 'past' | 'today' | 'next' | 'later';
  /** Already worded: "วันนี้", "รอบถัดไป · อีก 16 วัน", "ผ่านไปแล้ว". */
  tag?: string;
}

/**
 * The three rounds as cards side by side, flicked with the thumb. Scrolling is
 * the phone's own (native momentum, snapping to a card), so the glide feels like
 * every other list on the phone. It opens on the next round, the dots say where
 * you are, and a soft tap lands as each card settles.
 */
export function RoundsCarousel({ rounds, label }: { rounds: RoundCard[]; label: string }) {
  const listRef = useRef<HTMLOListElement>(null);
  const [active, setActive] = useState(0);
  const activeRef = useRef(0);
  const touched = useRef(false);

  // Open on the round that is happening or next.
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const i = Math.max(0, rounds.findIndex((r) => r.state === 'today' || r.state === 'next'));
    const card = list.children[i] as HTMLElement | undefined;
    if (card && i > 0) list.scrollLeft = card.offsetLeft - 24;
    activeRef.current = i;
    setActive(i);
  }, [rounds]);

  // Which card is in view, from the scroller itself (no scroll handler per frame).
  useEffect(() => {
    const list = listRef.current;
    if (!list || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            const i = [...list.children].indexOf(e.target);
            if (i !== activeRef.current && touched.current) haptic('tap');
            activeRef.current = i;
            setActive(i);
          }
        }
      },
      { root: list, threshold: 0.6 },
    );
    [...list.children].forEach((c) => io.observe(c));
    return () => io.disconnect();
  }, []);

  const go = (i: number) => {
    const list = listRef.current;
    const card = list?.children[i] as HTMLElement | undefined;
    if (!list || !card) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    list.scrollTo({ left: card.offsetLeft - 24, behavior: reduce ? 'auto' : 'smooth' });
  };

  return (
    <div className={styles.carousel}>
      <ol
        ref={listRef}
        className={styles.rounds}
        aria-label={label}
        onPointerDown={() => {
          touched.current = true;
        }}
      >
        {rounds.map((r) => (
          <li key={r.id} className={styles.round} data-state={r.state} data-round={r.id}>
            <div className={styles.roundHead}>
              <p className={`${styles.roundDate} ${palette.num}`}>{r.date}</p>
              {r.tag && (
                <span className={`${r.state === 'past' ? styles.tagPast : styles.tag} ${palette.num}`}>{r.tag}</span>
              )}
            </div>
            <h3 className={styles.roundName}>{r.name}</h3>
            <p className={styles.roundTheme}>{r.theme}</p>
          </li>
        ))}
      </ol>
      <div className={styles.dots}>
        {rounds.map((r, i) => (
          <button
            key={r.id}
            type="button"
            className={styles.dot}
            aria-label={r.name}
            aria-current={i === active ? 'true' : undefined}
            onClick={() => go(i)}
          />
        ))}
      </div>
    </div>
  );
}
