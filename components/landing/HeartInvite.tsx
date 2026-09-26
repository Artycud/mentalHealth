'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';

import { blobPath, idlePoint, moodColour, rgb } from '@/lib/heart';

import styles from './HeartInvite.module.css';

interface Copy {
  ask: string;
  title: string;
  tap: string;
  sub: string;
}

/**
 * The home's one invitation: a living heart to touch, not a button to press.
 * It drifts slowly through the check-up's four moods (nobody has asked it
 * anything yet, so it cannot settle), leans toward a finger, and squishes when
 * pressed. The whole panel is one link to the check-up.
 *
 * Shape, colour and lean are written to the DOM from one animation loop, so
 * React never re-renders while it moves. Still under reduced motion.
 */
export function HeartInvite({ greeting, copy }: { greeting: string; copy: Copy }) {
  const rootRef = useRef<HTMLAnchorElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const live = useRef({ near: false, angle: 0, pressed: false });

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const t0 = performance.now();
    let pull = 0;
    let squish = 1;
    let raf = 0;

    const frame = (now: number) => {
      const s = live.current;
      const t = reduce ? 0 : (now - t0) / 1000;
      const { x, y } = idlePoint(t * 0.8 + 1.2);
      rootRef.current?.style.setProperty('--c', rgb(moodColour(x, y)));

      pull += ((s.near && !reduce ? 1 : 0) - pull) * 0.1;
      squish += ((s.pressed ? 0.9 : 1) - squish) * 0.3;
      pathRef.current?.setAttribute(
        'd',
        blobPath({ energy: 0.35, weight: 0.3, t, scale: squish, pullAngle: s.angle, pull }),
      );
      if (!reduce) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  // The heart leans toward wherever the finger or pointer is over the panel.
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
      href="/checkup"
      className={styles.invite}
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
        <span className={styles.glow} />
        <span className={styles.ring} />
        <svg className={styles.heart} viewBox="-160 -160 320 320">
          <defs>
            <radialGradient id="invite-heart" cx="38%" cy="32%" r="75%">
              <stop offset="0%" style={{ stopColor: 'color-mix(in oklab, var(--c) 45%, #FFFFFF)' }} />
              <stop offset="55%" style={{ stopColor: 'var(--c)' }} />
              <stop offset="100%" style={{ stopColor: 'color-mix(in oklab, var(--c) 75%, #8A3D63)' }} />
            </radialGradient>
          </defs>
          <path
            ref={pathRef}
            fill="url(#invite-heart)"
            d={blobPath({ energy: 0.35, weight: 0.3, t: 0, scale: 1, pullAngle: 0, pull: 0 })}
          />
        </svg>
        <span className={styles.tap}>
          <span className={styles.tapDot} />
          {copy.tap}
        </span>
      </span>

      <span className={styles.foot}>
        <span className={styles.sub}>{copy.sub}</span>
        <span className={styles.go}>
          <svg width="22" height="22" viewBox="0 0 22 22">
            <path d="M7 4 L15 11 L7 18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </span>
    </Link>
  );
}
