'use client';

import { useEffect, useState, type RefObject } from 'react';

/**
 * Whether an element is on screen (with a little margin, so motion is already
 * running as it scrolls in). Also writes `data-live="true|false"` on it, which
 * the User Mode CSS uses to pause its looping animations off screen.
 */
export function useInView(ref: RefObject<Element | null>, margin = '120px'): boolean {
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Every phone this site targets has IntersectionObserver; it reports the
    // first state straight away, so motion starts as soon as the page shows.
    const io = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
        el.setAttribute('data-live', String(entry.isIntersecting));
      },
      { rootMargin: margin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, margin]);

  return inView;
}
