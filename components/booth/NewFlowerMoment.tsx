'use client';

import { useEffect, useState, type CSSProperties } from 'react';

import { loykrathongFlowers, tv } from '@/content/th/booth';
import { newArrivals, MAX_QUEUED, type Arrival } from '@/lib/new-flowers';

import { FlowerArt } from './FlowerArt';
import styles from './NewFlowerMoment.module.css';

/** How long one flower holds the screen, fade in and out included. */
const SHOW_MS = 5500;
/** When more are waiting, each is shown for less so the backlog clears quickly. */
const HURRY_MS = 3200;
/** In demo mode, how often a pretend flower arrives. */
const DEMO_EVERY_MS = 12_000;

interface Moment extends Arrival {
  /** Unique per arrival, so React replays the animation for each one. */
  id: string;
}

/**
 * The quiet screen that greets a new flower on the TV.
 *
 * When a result comes in, the busy dashboard steps back: a clean paper screen
 * fades in with ONE flower blooming in its own colour, its name, and a single soft
 * ring, then fades away, and the flower is already on the river beneath. Nothing
 * else on the screen is coloured while it plays — no confetti, no burst — so it
 * reads as a moment of attention rather than an alarm, in a room where the screen
 * is mostly background.
 *
 * It is anonymous by construction (BRIEF §12): it shows a flower and nothing
 * about who got it, because the screen is in a room full of people.
 *
 * How it knows: the TV polls, so it never hears "a flower was added"; it sees the
 * total rise (see lib/new-flowers.ts for the rules, which are tested).
 */
export function NewFlowerMoment({
  total,
  recent,
  demo = false,
}: {
  total: number;
  recent: Arrival[];
  /** Pretend a flower arrives every few seconds, so the design can be reviewed. */
  demo?: boolean;
}) {
  const [seenTotal, setSeenTotal] = useState(total);
  const [queue, setQueue] = useState<Moment[]>([]);

  // Derive the new arrivals during render, from the props, rather than in an
  // effect: React's recommended way to react to a prop changing. `seenTotal`
  // starts equal to the first `total`, so the first render celebrates nothing.
  if (total !== seenTotal) {
    setSeenTotal(total);
    const fresh = newArrivals(seenTotal, total, recent).map((a, i) => ({ ...a, id: `${total}-${i}` }));
    if (fresh.length > 0) setQueue((q) => [...q, ...fresh].slice(-MAX_QUEUED));
  }

  const current = queue[0];
  const ms = queue.length > 1 ? HURRY_MS : SHOW_MS;

  // Each moment plays for its time, then makes way for the next.
  useEffect(() => {
    if (!current) return;
    const timer = setTimeout(() => setQueue((q) => q.slice(1)), ms);
    return () => clearTimeout(timer);
    // Keyed to WHICH moment is showing. `ms` is read from the same render.
  }, [current?.id, ms]); // eslint-disable-line react-hooks/exhaustive-deps

  // Demo: the design can be reviewed before any real results exist.
  useEffect(() => {
    if (!demo) return;
    let n = 0;
    const arrive = () => {
      const f = loykrathongFlowers[n % loykrathongFlowers.length];
      n += 1;
      setQueue((q) => [...q, { id: `demo-${n}`, flowerId: f.id, name: f.name, tint: f.tint }].slice(-MAX_QUEUED));
    };
    let every: ReturnType<typeof setInterval> | undefined;
    const first = setTimeout(() => {
      arrive();
      every = setInterval(arrive, DEMO_EVERY_MS);
    }, 4000);
    return () => {
      clearTimeout(first);
      clearInterval(every);
    };
  }, [demo]);

  if (!current) return null;
  const flower = loykrathongFlowers.find((f) => f.id === current.flowerId);
  if (!flower) return null;

  return (
    // The animation is as long as the timer, from one number.
    <div
      className={styles.veil}
      role="status"
      key={current.id}
      style={{ '--moment-ms': `${ms}ms` } as CSSProperties}
    >
      <p className={styles.note}>{tv.newNote}</p>
      <div className={styles.art}>
        <span className={styles.ring} aria-hidden="true" />
        <FlowerArt flower={flower} />
      </div>
      <h2 className={styles.name}>{flower.name}</h2>
      <p className={styles.line}>{tv.newLine}</p>
    </div>
  );
}
