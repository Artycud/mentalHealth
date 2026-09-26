'use client';

import Link from 'next/link';
import { useEffect, useState, useSyncExternalStore } from 'react';

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

/** Reduced motion, read without a flash: false on the server, the real value in the browser. */
const MOTION_QUERY = '(prefers-reduced-motion: reduce)';
const subscribeMotion = (onChange: () => void) => {
  const q = window.matchMedia(MOTION_QUERY);
  q.addEventListener('change', onChange);
  return () => q.removeEventListener('change', onChange);
};

/** Split into what a reader sees as characters, so Thai marks never break apart. */
function graphemes(text: string): string[] {
  const Seg = (Intl as unknown as { Segmenter?: new (l: string, o: object) => { segment(t: string): Iterable<{ segment: string }> } }).Segmenter;
  return Seg ? [...new Seg('th', { granularity: 'grapheme' }).segment(text)].map((s) => s.segment) : [...text];
}

/**
 * The two other things on the home, as panels you can tell are alive:
 * MBTI's four letters keep flipping (which are yours?), and VENT's note types
 * out the kind of thing people carry. Both still under reduced motion.
 */
export function MorePanels({ mbti, vent, samples }: { mbti: PanelCopy; vent: PanelCopy; samples: readonly string[] }) {
  const [flip, setFlip] = useState(0);
  const [typed, setTyped] = useState('');
  const still = useSyncExternalStore(
    subscribeMotion,
    () => window.matchMedia(MOTION_QUERY).matches,
    () => false,
  );

  useEffect(() => {
    if (still) return;
    const flipper = setInterval(() => setFlip((f) => f + 1), 1400);

    // Type a sample, hold it, clear it, next.
    let sample = 0;
    let at = 0;
    let parts = graphemes(samples[0]);
    let timer: ReturnType<typeof setTimeout> | undefined;
    const step = () => {
      if (at <= parts.length) {
        setTyped(parts.slice(0, at).join(''));
        at += 1;
        timer = setTimeout(step, 90);
      } else {
        timer = setTimeout(() => {
          sample = (sample + 1) % samples.length;
          parts = graphemes(samples[sample]);
          at = 0;
          step();
        }, 2200);
      }
    };
    timer = setTimeout(step, 400);
    return () => {
      clearInterval(flipper);
      clearTimeout(timer);
    };
  }, [samples, still]);

  return (
    <div className={styles.panels}>
      <Link href="/me" className={styles.panel} data-panel="mbti">
        <span className={styles.words}>
          <span className={styles.note}>{mbti.note}</span>
          <span className={styles.title}>{mbti.title}</span>
        </span>
        <span className={styles.tiles} aria-hidden="true">
          {PAIRS.map((pair, i) => {
            // Each tile turns on its own beat, so the four never line up.
            const turns = Math.floor((flip + i) / RATE[i]);
            const letter = still ? '?' : pair[turns % 2];
            return (
              <span key={pair.join('')} className={styles.tile} data-i={i}>
                <span key={turns} className={styles.letter}>
                  {letter}
                </span>
              </span>
            );
          })}
        </span>
        <Foot text={mbti.foot} />
      </Link>

      <Link href="/vent" className={styles.panel} data-panel="vent">
        <span className={styles.words}>
          <span className={styles.note}>{vent.note}</span>
          <span className={styles.title}>{vent.title}</span>
        </span>
        <span className={styles.paper} aria-hidden="true">
          <span className={styles.typed}>{still ? samples[0] : typed}</span>
          {!still && <span className={styles.caret} />}
        </span>
        <Foot text={vent.foot} />
      </Link>
    </div>
  );
}

function Foot({ text }: { text: string }) {
  return (
    <span className={styles.foot}>
      <span className={styles.footText}>{text}</span>
      <span className={styles.go} aria-hidden="true">
        <svg width="22" height="22" viewBox="0 0 22 22">
          <path d="M7 4 L15 11 L7 18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </span>
  );
}
