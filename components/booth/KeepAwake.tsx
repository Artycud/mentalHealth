'use client';

import { useEffect } from 'react';

/**
 * Keeps a booth screen (the iPad, the TV) from dimming or locking during the
 * booth's two hours, with the Screen Wake Lock API.
 *
 * The browser drops the lock whenever the page is hidden, so it is asked for again
 * each time the page comes back. Where the API is missing (older browsers) this
 * does nothing, and the staff checklist (docs/booth-day.md) covers the device's own
 * settings: Auto-Lock off on the iPad, sleep off on the TV's computer.
 */
export function KeepAwake() {
  useEffect(() => {
    let lock: WakeLockSentinel | null = null;
    let active = true;

    const ask = async () => {
      if (!('wakeLock' in navigator) || document.visibilityState !== 'visible') return;
      try {
        const next = await navigator.wakeLock.request('screen');
        if (active) lock = next;
        else void next.release();
      } catch {
        /* refused (low battery, no permission): the device settings still apply */
      }
    };

    void ask();
    document.addEventListener('visibilitychange', ask);
    return () => {
      active = false;
      document.removeEventListener('visibilitychange', ask);
      void lock?.release().catch(() => {});
    };
  }, []);

  return null;
}
