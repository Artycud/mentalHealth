'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Keeps the TV current by re-rendering the page on the server every few seconds.
 *
 * Plain polling, on purpose. The TV has to work on Vercel, where a request is
 * served by a short-lived function that cannot hold a WebSocket or a
 * server-sent-events stream open (BRIEF, *Hosting*), and it has to work on a
 * school server too. `router.refresh()` re-fetches the page's data and updates
 * the DOM in place, so the river keeps drifting and a bar eases to its new value
 * rather than the whole screen reloading and flashing.
 *
 * It pauses while the tab is hidden, and catches up the moment it is shown again.
 */
export function AutoRefresh({ everyMs = 5000 }: { everyMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === 'visible') router.refresh();
    };
    const timer = setInterval(tick, everyMs);
    document.addEventListener('visibilitychange', tick);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', tick);
    };
  }, [router, everyMs]);

  return null;
}
