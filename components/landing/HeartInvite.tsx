'use client';

import Link from 'next/link';
import { ViewTransition, useEffect, useRef } from 'react';

import { HeartGlyph } from '@/components/heart/HeartGlyph';
import palette from '@/components/heart/palette.module.css';
import { useInView } from '@/components/heart/useInView';
import { prefersReducedMotion, subscribe } from '@/lib/frame';
import { blobPath, idlePoint, moodColour, rgb } from '@/lib/heart';
import { FORWARD } from '@/lib/nav';

import styles from './HeartInvite.module.css';

interface Copy {
  ask: string;
  title: string;
  sub: string;
  go: string;
}

const FIRST = blobPath({ energy: 0.35, weight: 0.3, t: 0, scale: 1, pullAngle: 0, pull: 0 });

/**
 * The home's one invitation, and the one rose thing on the home: a card with a
 * living heart in it. The whole card is the link (a thumb can land anywhere on
 * it). The heart drifts slowly through the check-up's moods (nobody has asked it
 * anything yet, so it cannot settle), leans toward a finger, and squishes when
 * pressed; on the way to the check-up it flies into the check-up's heart.
 *
 * It moves only while it is on screen, on the shared frame loop, and draws no
 * filters, so it costs a phone almost nothing.
 */
export function HeartInvite({ greeting, copy }: { greeting: string; copy: Copy }) {
  const rootRef = useRef<HTMLAnchorElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const live = useRef({ near: false, angle: 0, pressed: false });
  const inView = useInView(rootRef);

  useEffect(() => {
    if (!inView) return;
    const reduce = prefersReducedMotion();
    const t0 = performance.now();
    let pull = 0;
    let squish = 1;

    const draw = (now: number, skip = false) => {
      const s = live.current;
      const t = reduce ? 0 : (now - t0) / 1000;
      const { x, y } = idlePoint(t * 0.8 + 1.2);
      rootRef.current?.style.setProperty('--c', rgb(moodColour(x, y)));
      pull += ((s.near && !reduce ? 1 : 0) - pull) * 0.1;
      squish += ((s.pressed ? 0.9 : 1) - squish) * 0.3;
      if (!skip) pathRef.current?.setAttribute('d', blobPath({ energy: 0.35, weight: 0.3, t, scale: squish, pullAngle: s.angle, pull }));
    };

    if (reduce) {
      draw(t0);
      return;
    }
    return subscribe((now, info) => draw(now, info.skip));
  }, [inView]);

  // The heart leans toward wherever the finger or pointer is over the card.
  const move = (e: React.PointerEvent) => {
    const svg = rootRef.current?.querySelector('svg');
    if (!svg) return;
    const r = svg.getBoundingClientRect();
    live.current.angle = Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2));
    live.current.near = true;
  };
  const leave = () => {
    live.current.near = false;
    live.current.pressed = false;
  };

  return (
    <Link
      ref={rootRef}
      href="/checkup?start=1"
      transitionTypes={FORWARD}
      className={`${palette.card} ${styles.invite}`}
      data-press
      onPointerMove={move}
      onPointerLeave={leave}
      onPointerDown={(e) => {
        move(e);
        live.current.pressed = true;
      }}
      onPointerUp={() => {
        live.current.pressed = false;
      }}
      onPointerCancel={leave}
    >
      <span className={styles.words}>
        <span className={styles.ask}>
          {greeting} {copy.ask}
        </span>
        <span className={styles.title}>{copy.title}</span>
      </span>

      <span className={styles.stage} aria-hidden="true">
        <span className={styles.disc} />
        <span className={styles.ring} />
        <ViewTransition name="checkup-heart" share="heart-morph" default="none">
          <span className={styles.heartBox}>
            <HeartGlyph pathRef={pathRef} d={FIRST} className={styles.heart} />
          </span>
        </ViewTransition>
      </span>

      <span className={styles.sub}>{copy.sub}</span>
      <span className={`${palette.primary} ${styles.go}`}>
        {copy.go}
        <svg width="20" height="20" viewBox="0 0 22 22" aria-hidden="true">
          <path d="M7 4 L15 11 L7 18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </Link>
  );
}
