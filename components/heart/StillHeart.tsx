'use client';

import { useEffect, useRef } from 'react';

import { blobPath, moodColour, rgb } from '@/lib/heart';

/**
 * The check-up's heart, for a screen that only shows one: a given energy and
 * weight, its colour from the same mood map, breathing slowly. Stops under
 * reduced motion.
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
  const pathRef = useRef<SVGPathElement>(null);
  const colour = rgb(moodColour(energy, weight));

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const t0 = performance.now();
    let raf = 0;
    const frame = (now: number) => {
      const t = reduce ? 0 : (now - t0) / 1000;
      pathRef.current?.setAttribute('d', blobPath({ energy, weight, t, scale: 1, pullAngle: 0, pull: 0 }));
      if (!reduce) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [energy, weight]);

  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="-160 -160 320 320"
      aria-hidden="true"
      style={{ overflow: 'visible', display: 'block', filter: 'drop-shadow(0 16px 26px rgba(138, 61, 99, 0.28))' }}
    >
      <defs>
        <radialGradient id="still-heart" cx="38%" cy="32%" r="75%">
          <stop offset="0%" style={{ stopColor: `color-mix(in oklab, ${colour} 45%, #FFFFFF)` }} />
          <stop offset="55%" style={{ stopColor: colour }} />
          <stop offset="100%" style={{ stopColor: `color-mix(in oklab, ${colour} 75%, #8A3D63)` }} />
        </radialGradient>
      </defs>
      <path ref={pathRef} fill="url(#still-heart)" d={blobPath({ energy, weight, t: 0, scale: 1, pullAngle: 0, pull: 0 })} />
    </svg>
  );
}
