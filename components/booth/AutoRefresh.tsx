'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';

/** How long without a successful refresh before the screen says it is not live. */
export const STALE_AFTER_MS = 30_000;
/** How long stale before one full reload, made only once the server answers again. */
export const RELOAD_AFTER_MS = 180_000;

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
 * It never refreshes blind. In this Next.js version a refresh that fails (Wi-Fi
 * gone, or the server restarting) becomes a full page load, and a full page load
 * with no server leaves the browser's own error page on the TV until someone
 * walks over and reloads it. So each tick first asks /api/booth/ping, and only
 * refreshes when that answers. Until it does, the last good screen stays up.
 *
 * It reports whether it is live by setting `data-stale` on <html>, so the TV can
 * grey its "สด" dot without this component knowing about the page. After
 * RELOAD_AFTER_MS of being stale, once the server answers again, it reloads the
 * page once, to clear anything a long outage may have left half-done.
 *
 * It pauses while the tab is hidden, and catches up the moment it is shown again.
 */
export function AutoRefresh({ everyMs = 5000 }: { everyMs?: number }) {
  const router = useRouter();
  const lastGood = useRef(0);

  useEffect(() => {
    lastGood.current = Date.now();
    let busy = false;
    const root = document.documentElement;

    const tick = async () => {
      if (busy || document.visibilityState !== 'visible') return;
      busy = true;
      try {
        const response = await fetch('/api/booth/ping', { cache: 'no-store' });
        if (!response.ok) throw new Error(`ping ${response.status}`);
        const staleFor = Date.now() - lastGood.current;
        lastGood.current = Date.now();
        delete root.dataset.stale;
        if (staleFor > RELOAD_AFTER_MS) {
          window.location.reload();
          return;
        }
        router.refresh();
      } catch {
        if (Date.now() - lastGood.current > STALE_AFTER_MS) root.dataset.stale = 'true';
      } finally {
        busy = false;
      }
    };

    const timer = setInterval(tick, everyMs);
    document.addEventListener('visibilitychange', tick);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', tick);
      delete root.dataset.stale;
    };
  }, [router, everyMs]);

  return null;
}
