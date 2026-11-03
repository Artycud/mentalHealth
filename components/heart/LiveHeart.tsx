'use client';

import { useEffect, useRef } from 'react';

import { prefersReducedMotion, subscribe } from '@/lib/frame';
import { blobPath, moodColour, rgb } from '@/lib/heart';

import { HeartGlyph } from './HeartGlyph';
import { useInView } from './useInView';

/** Set the colour only when it really changed (each change restyles the heart). */
function paint(el: HTMLElement | null, cache: { colour: string }, c: string) {
  if (c === cache.colour) return;
  cache.colour = c;
  el?.style.setProperty('--c', c);
}

/**
 * The heart as a companion: it eases toward a new mood rather than jumping, and
 * while `listening` it leans toward the words below it and pulses gently. Every
 * change is eased on the shared frame loop (lib/frame.ts), only while the heart
 * is on screen, so React only passes the targets. Still under reduced motion.
 */
export function LiveHeart({
  energy,
  weight,
  listening = false,
  colour,
  className,
}: {
  energy: number;
  weight: number;
  listening?: boolean;
  /** A fixed colour; without it, the colour of the mood map at (energy, weight). */
  colour?: string;
  className?: string;
}) {
  const boxRef = useRef<HTMLSpanElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const target = useRef({ energy, weight, listening, colour });
  const now = useRef({ energy, weight, pull: 0, t0: 0, colour: '' });
  const inView = useInView(boxRef, '0px');

  useEffect(() => {
    target.current = { energy, weight, listening, colour };
    // Under reduced motion there is no loop: draw the new mood once, still.
    if (prefersReducedMotion()) {
      pathRef.current?.setAttribute('d', blobPath({ energy, weight, t: 0, scale: 1, pullAngle: 0, pull: 0 }));
      paint(boxRef.current, now.current, colour ?? rgb(moodColour(energy, weight)));
    }
  }, [energy, weight, listening, colour]);

  useEffect(() => {
    if (!inView || prefersReducedMotion()) return;
    const n = now.current;
    if (!n.t0) n.t0 = performance.now();

    return subscribe((time, info) => {
      const goal = target.current;
      const t = (time - n.t0) / 1000;
      n.energy += (goal.energy - n.energy) * 0.04;
      n.weight += (goal.weight - n.weight) * 0.04;
      n.pull += ((goal.listening ? 1 : 0) - n.pull) * 0.06;
      paint(boxRef.current, n, goal.colour ?? rgb(moodColour(n.energy, n.weight)));
      if (info.skip) return;
      const pulse = goal.listening ? 1 + Math.sin(t * 3) * 0.04 : 1;
      pathRef.current?.setAttribute(
        'd',
        blobPath({ energy: n.energy, weight: n.weight, t, scale: pulse, pullAngle: Math.PI / 2, pull: n.pull }),
      );
    });
  }, [inView]);

  return (
    <span ref={boxRef} className={className} style={{ display: 'block', '--c': colour ?? rgb(moodColour(energy, weight)) } as React.CSSProperties}>
      <HeartGlyph
        pathRef={pathRef}
        d={blobPath({ energy, weight, t: 0, scale: 1, pullAngle: 0, pull: 0 })}
        style={{ display: 'block', width: '100%', height: '100%' }}
      />
    </span>
  );
}
