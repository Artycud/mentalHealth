'use client';

import { useEffect } from 'react';

import { haptic } from '@/lib/haptics';

let mounted = 0;

function onDown(e: PointerEvent) {
  if (e.button !== 0) return;
  const el = (e.target as Element | null)?.closest<HTMLElement>('[data-press]');
  if (!el || el.matches(':disabled, [data-off="true"]')) return;

  haptic('tap');

  // A soft ripple from under the finger: transform and opacity only, on the
  // element's ::after (styles in app/globals.css), so it never triggers layout.
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !el.animate) return;
  const r = el.getBoundingClientRect();
  const x = e.clientX - r.left;
  const y = e.clientY - r.top;
  const reach = Math.hypot(Math.max(x, r.width - x), Math.max(y, r.height - y));
  el.style.setProperty('--px', `${x}px`);
  el.style.setProperty('--py', `${y}px`);
  try {
    el.animate(
      [
        { transform: 'scale(0)', opacity: 0.22 },
        { transform: `scale(${(reach / 12).toFixed(2)})`, opacity: 0 },
      ],
      { duration: 520, easing: 'cubic-bezier(0.2, 0, 0, 1)', pseudoElement: '::after' },
    );
  } catch {
    // Older browsers cannot animate a pseudo-element: the press scale still shows.
  }
}

/**
 * Press feedback for User Mode, with one listener for the whole page: anything
 * marked `data-press` gets a ripple from where the finger landed and a tiny
 * haptic tap. Mount once per page; extra mounts share the same listener.
 */
export function Press() {
  useEffect(() => {
    if (mounted++ === 0) document.addEventListener('pointerdown', onDown, { passive: true });
    return () => {
      if (--mounted === 0) document.removeEventListener('pointerdown', onDown);
    };
  }, []);
  return null;
}
