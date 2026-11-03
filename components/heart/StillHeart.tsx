'use client';

import { useEffect, useRef } from 'react';

import { prefersReducedMotion, subscribe } from '@/lib/frame';
import { blobPath, moodColour, rgb } from '@/lib/heart';

import { HeartGlyph } from './HeartGlyph';
import { useInView } from './useInView';

/**
 * The check-up's heart, for a screen that only shows one: a given energy and
 * weight, its colour from the same mood map, breathing slowly. Breathes on the
 * shared frame loop only while on screen; still under reduced motion.
 */
export function StillHeart({
  energy,
  weight,
  size = 200,
  className,
}: {
  energy: number;
  weight: number;
  size?: number;
  className?: string;
}) {
  const boxRef = useRef<HTMLSpanElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const colour = rgb(moodColour(energy, weight));
  const inView = useInView(boxRef, '0px');

  useEffect(() => {
    if (!inView || prefersReducedMotion()) return;
    const t0 = performance.now();
    return subscribe((now, info) => {
      if (info.skip) return;
      pathRef.current?.setAttribute('d', blobPath({ energy, weight, t: (now - t0) / 1000, scale: 1, pullAngle: 0, pull: 0 }));
    });
  }, [energy, weight, inView]);

  return (
    <span ref={boxRef} className={className} style={{ display: 'block', width: size, height: size }}>
      <HeartGlyph
        pathRef={pathRef}
        colour={colour}
        d={blobPath({ energy, weight, t: 0, scale: 1, pullAngle: 0, pull: 0 })}
        style={{ display: 'block', width: '100%', height: '100%' }}
      />
    </span>
  );
}
