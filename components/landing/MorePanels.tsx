'use client';

import Link from 'next/link';
import { useEffect, useRef, type ReactNode } from 'react';

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

/** Split into what a reader sees as characters, so Thai marks never break apart. */
function graphemes(text: string): string[] {
  const Seg = (Intl as unknown as { Segmenter?: new (l: string, o: object) => { segment(t: string): Iterable<{ segment: string }> } }).Segmenter;
  return Seg ? [...new Seg('th', { granularity: 'grapheme' }).segment(text)].map((s) => s.segment) : [...text];
}

/**
 * "อยากไปต่อ": VENT, then (`between`) the human option, then MBTI, as cards you
 * can tell are alive: VENT's note types out the kind of thing people carry, and
 * MBTI's four letters keep flipping (which are yours?).
 *
 * Both write straight to the DOM (React never re-renders for them), and both
 * stop while their card is off screen. Still under reduced motion.
 */
export function MorePanels({
  mbti,
  vent,
  samples,
  between,
}: {
  mbti: PanelCopy;
  vent: PanelCopy;
  samples: readonly string[];
  /** Shown between VENT and MBTI: the human option, CUD Care. */
  between?: ReactNode;
}) {
  return (
    <div className={styles.panels}>
      <Link href="/vent" transitionTypes={FORWARD} className={`${palette.card} ${styles.panel}`} data-panel="vent" data-press>
        <span className={styles.words}>
          <span className={styles.note}>{vent.note}</span>
          <span className={styles.title}>{vent.title}</span>
        </span>
        <TypedNote samples={samples} />
        <Foot text={vent.foot} />
      </Link>

      {between}

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

/** A note being written: types a sample, holds it, clears it, next. */
function TypedNote({ samples }: { samples: readonly string[] }) {
  const boxRef = useRef<HTMLSpanElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const inView = useInView(boxRef);

  useEffect(() => {
    const el = textRef.current;
    if (!el) return;
    if (prefersReducedMotion()) {
      el.textContent = samples[0];
      boxRef.current?.setAttribute('data-still', 'true');
      return;
    }
    if (!inView) return;
    let sample = 0;
    let at = 0;
    let parts = graphemes(samples[0]);
    let timer: ReturnType<typeof setTimeout>;
    const step = () => {
      if (at <= parts.length) {
        el.textContent = parts.slice(0, at).join('');
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
    return () => clearTimeout(timer);
  }, [samples, inView]);

  return (
    <span ref={boxRef} className={styles.paper} aria-hidden="true">
      <span ref={textRef} className={styles.typed} />
      <span className={styles.caret} />
    </span>
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
