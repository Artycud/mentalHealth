'use client';

import { useEffect, useRef } from 'react';

import { blobPath } from '@/lib/heart';

/**
 * Everyone's hearts, drifting. Not interactive — just there, like people in the
 * canteen. Each one is the check-up's heart at a different energy and weight,
 * in one of its four colours, so the home already speaks the same language.
 */
const HEARTS = [
  { x: 20, y: 24, size: 48, fill: '#6FD7B8', energy: 0.2, weight: 0.2, speed: 0.7, phase: 0 },
  { x: 80, y: 14, size: 36, fill: '#FFC94D', energy: 0.8, weight: 0.15, speed: 1.1, phase: 1.3 },
  { x: 64, y: 50, size: 64, fill: '#9BAAFF', energy: 0.35, weight: 0.6, speed: 0.5, phase: 2.1 },
  { x: 10, y: 70, size: 30, fill: '#FF8FB5', energy: 0.7, weight: 0.5, speed: 0.9, phase: 3.4 },
  { x: 90, y: 78, size: 40, fill: '#FF9A85', energy: 0.5, weight: 0.3, speed: 0.8, phase: 4.2 },
  { x: 34, y: 48, size: 22, fill: '#F0588A', energy: 0.3, weight: 0.3, speed: 0.6, phase: 5.0 },
  { x: 48, y: 10, size: 18, fill: '#FFB3CB', energy: 0.6, weight: 0.2, speed: 1.2, phase: 0.6 },
];

export function DriftingHearts({ className }: { className?: string }) {
  const paths = useRef<(SVGPathElement | null)[]>([]);
  const groups = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const t0 = performance.now();
    let raf = 0;
    const frame = (now: number) => {
      const t = reduce ? 0 : (now - t0) / 1000;
      HEARTS.forEach((h, i) => {
        paths.current[i]?.setAttribute(
          'd',
          blobPath({ energy: h.energy, weight: h.weight, t: t + h.phase * 3, scale: 1, pullAngle: 0, pull: 0 }),
        );
        const g = groups.current[i];
        if (g) {
          const dx = Math.sin(t * 0.13 * h.speed + h.phase) * 14;
          const dy = Math.cos(t * 0.17 * h.speed + h.phase) * 18;
          g.style.transform = `translate(${dx}px, ${dy}px)`;
        }
      });
      if (!reduce) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className={className} aria-hidden="true">
      {HEARTS.map((h, i) => (
        <div
          key={i}
          ref={(el) => {
            groups.current[i] = el;
          }}
          style={{
            position: 'absolute',
            left: `${h.x}%`,
            top: `${h.y}%`,
            width: `${h.size}vmin`,
            maxWidth: `${h.size * 4.6}px`,
            translate: '-50% -50%',
          }}
        >
          <svg viewBox="-160 -160 320 320" style={{ width: '100%', overflow: 'visible', display: 'block' }}>
            <defs>
              <radialGradient id={`dh-${i}`} cx="38%" cy="32%" r="75%">
                <stop offset="0%" style={{ stopColor: `color-mix(in oklab, ${h.fill} 45%, #FFFFFF)` }} />
                <stop offset="55%" style={{ stopColor: h.fill }} />
                <stop offset="100%" style={{ stopColor: `color-mix(in oklab, ${h.fill} 75%, #8A3D63)` }} />
              </radialGradient>
            </defs>
            <path
              ref={(el) => {
                paths.current[i] = el;
              }}
              fill={`url(#dh-${i})`}
            />
          </svg>
        </div>
      ))}
    </div>
  );
}
