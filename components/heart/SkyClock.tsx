'use client';

import { useEffect } from 'react';

import { skyTimeNow, type SkyTime } from '@/lib/sky-time';

/** The top colour of each sky (components/heart/Sky.module.css). */
const TOP: Record<SkyTime, string> = { morning: '#f4b3a2', day: '#7fb8e2', dusk: '#2a2f6b', night: '#0b1433' };

/**
 * Keeps the sky's mood right while a page stays open: the script in <head>
 * chose it at load (lib/sky-time.ts), and a phone left on the home over the
 * evening should see the dusk turn to night. Checked when the page comes back
 * into view, and every few minutes while it is shown.
 */
export function SkyClock() {
  useEffect(() => {
    const set = () => {
      if (document.hidden) return;
      const time = skyTimeNow(window.location.search);
      if (document.documentElement.dataset.time !== time) document.documentElement.dataset.time = time;
      // Safari tints its bars with theme-color: give it the top of this sky.
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', TOP[time]);
    };
    set();
    const timer = setInterval(set, 5 * 60_000);
    document.addEventListener('visibilitychange', set);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', set);
    };
  }, []);
  return null;
}
