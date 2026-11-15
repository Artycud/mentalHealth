'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';

import palette from '@/components/heart/palette.module.css';
import { useInView } from '@/components/heart/useInView';
import { prefersReducedMotion } from '@/lib/frame';
import { FORWARD } from '@/lib/nav';

import styles from './MorePanels.module.css';

interface PanelCopy {
  note: string;
  title: string;
  foot: string;
}

/** The four MBTI pairs, each on its own coloured tile. */
const PAIRS = [
  ['E', 'I'],
  ['S', 'N'],
  ['T', 'F'],
  ['J', 'P'],
] as const;

/** How many beats each tile waits before it turns. */
const RATE = [2, 3, 1, 4];

/**
 * "อยากไปต่อ": MBTI, as a slip you can tell is alive: its four letters keep
 * flipping (which are yours?). VENT and the human option, CUD Care, are on the
 * home's first screen (components/landing/Landing, the slips under the question).
 *
 * The tiles write straight to the DOM (React never re-renders for them), and
 * stop while the slip is off screen. Still under reduced motion.
 */
export function MorePanels({ mbti }: { mbti: PanelCopy }) {
  return (
    <div className={styles.panels}>
      <Link href="/me" transitionTypes={FORWARD} className={`${palette.card} ${styles.panel}`} data-panel="mbti" data-press>
        <span className={styles.words}>
          <span className={styles.note}>{mbti.note}</span>
          <span className={styles.title}>{mbti.title}</span>
        </span>
        <Tiles />
        <Foot text={mbti.foot} />
      </Link>
    </div>
  );
}

/** Four tiles, each turning on its own beat so they never line up. */
function Tiles() {
  const boxRef = useRef<HTMLSpanElement>(null);
  const inView = useInView(boxRef);

  useEffect(() => {
    const letters = [...(boxRef.current?.querySelectorAll<HTMLElement>('[data-letter]') ?? [])];
    if (prefersReducedMotion() || !inView) return;
    let beat = 0;
    const timer = setInterval(() => {
      beat += 1;
      letters.forEach((el, i) => {
        if ((beat + i) % RATE[i] !== 0) return;
        const next = PAIRS[i][Math.floor((beat + i) / RATE[i]) % 2];
        el.textContent = next;
        // Restart the turn: drop the class, and put it back on the next frame.
        el.classList.remove(styles.turn);
        requestAnimationFrame(() => el.classList.add(styles.turn));
      });
    }, 1400);
    return () => clearInterval(timer);
  }, [inView]);

  return (
    <span ref={boxRef} className={styles.tiles} aria-hidden="true">
      {PAIRS.map((pair, i) => (
        <span key={pair.join('')} className={styles.tile} data-i={i}>
          <span data-letter className={styles.letter}>
            ?
          </span>
        </span>
      ))}
    </span>
  );
}

function Foot({ text }: { text: string }) {
  return (
    <span className={styles.foot}>
      <span className={styles.footText}>{text}</span>
      <span className={palette.go} aria-hidden="true">
        <svg width="20" height="20" viewBox="0 0 22 22">
          <path d="M7 4 L15 11 L7 18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </span>
  );
}
