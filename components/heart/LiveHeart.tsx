'use client';

import { useEffect, useRef } from 'react';

import { blobPath, moodColour, rgb } from '@/lib/heart';

/**
 * The heart as a companion: it eases toward a new mood rather than jumping, and
 * while `listening` it leans toward the words below it and pulses gently. Every
 * change is eased inside one animation loop, so React only passes the targets.
 * Still under reduced motion.
 */
export function LiveHeart({
  energy,
  weight,
  listening = false,
  className,
}: {
  energy: number;
  weight: number;
  listening?: boolean;
  className?: string;
}) {
  const pathRef = useRef<SVGPathElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const target = useRef({ energy, weight, listening });

  useEffect(() => {
    target.current = { energy, weight, listening };
    // Under reduced motion there is no loop: draw the new mood once, still.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      pathRef.current?.setAttribute('d', blobPath({ energy, weight, t: 0, scale: 1, pullAngle: 0, pull: 0 }));
      svgRef.current?.style.setProperty('--c', rgb(moodColour(energy, weight)));
    }
  }, [energy, weight, listening]);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const t0 = performance.now();
    const now = { ...target.current, pull: 0 };
    let raf = 0;

    const frame = (time: number) => {
      const goal = target.current;
      const t = (time - t0) / 1000;
      now.energy += (goal.energy - now.energy) * 0.04;
      now.weight += (goal.weight - now.weight) * 0.04;
      now.pull += ((goal.listening ? 1 : 0) - now.pull) * 0.06;

      const pulse = goal.listening ? 1 + Math.sin(t * 3) * 0.04 : 1;
      pathRef.current?.setAttribute(
        'd',
        blobPath({ energy: now.energy, weight: now.weight, t, scale: pulse, pullAngle: Math.PI / 2, pull: now.pull }),
      );
      svgRef.current?.style.setProperty('--c', rgb(moodColour(now.energy, now.weight)));
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <svg ref={svgRef} className={className} viewBox="-160 -160 320 320" aria-hidden="true" style={{ overflow: 'visible' }}>
      <defs>
        <radialGradient id="live-heart" cx="38%" cy="32%" r="75%">
          <stop offset="0%" style={{ stopColor: 'color-mix(in oklab, var(--c) 45%, #FFFFFF)' }} />
          <stop offset="55%" style={{ stopColor: 'var(--c)' }} />
          <stop offset="100%" style={{ stopColor: 'color-mix(in oklab, var(--c) 75%, #8A3D63)' }} />
        </radialGradient>
      </defs>
      <path ref={pathRef} fill="url(#live-heart)" />
    </svg>
  );
}
