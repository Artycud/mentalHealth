'use client';

import { useEffect, useState } from 'react';

import styles from './TvControls.module.css';

const IDLE_MS = 3000;

/** Safari on iPads before iPadOS 16.4 has the full-screen calls only under a webkit prefix. */
type WebkitDoc = Document & { webkitFullscreenElement?: Element | null; webkitFullscreenEnabled?: boolean };
type WebkitEl = HTMLElement & { webkitRequestFullscreen?: () => void };

const isFull = () => !!(document.fullscreenElement ?? (document as WebkitDoc).webkitFullscreenElement);
const canFull = () => !!(document.fullscreenEnabled || (document as WebkitDoc).webkitFullscreenEnabled);

function goFull() {
  const root = document.documentElement as WebkitEl;
  if (root.requestFullscreen) void root.requestFullscreen().catch(() => {});
  else root.webkitRequestFullscreen?.();
}

/**
 * A small "full screen" button. Going full screen needs a click or a tap: a
 * browser will not do it on its own.
 *
 * - On a TV driven by a laptop (the default), the mouse pointer hides itself after
 *   a few seconds still, and the button appears only while the mouse moves and
 *   the page is not already full screen. On a smart TV with no mouse it never shows.
 * - With `touch` (the kiosk iPad), it shows whenever the page is not full screen,
 *   for staff to tap once. iPad Safari supports it; iPhone Safari does not, so
 *   there it never shows.
 */
export function TvControls({ label, touch = false }: { label: string; touch?: boolean }) {
  const [moving, setMoving] = useState(false);
  const [full, setFull] = useState(true);

  useEffect(() => {
    const root = document.documentElement;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const onMove = () => {
      setMoving(true);
      delete root.dataset.cursorIdle;
      clearTimeout(timer);
      timer = setTimeout(() => {
        setMoving(false);
        root.dataset.cursorIdle = 'true';
      }, IDLE_MS);
    };
    const onFull = () => setFull(isFull());
    onFull();
    if (!touch) {
      root.dataset.cursorIdle = 'true';
      window.addEventListener('mousemove', onMove);
    }
    document.addEventListener('fullscreenchange', onFull);
    document.addEventListener('webkitfullscreenchange', onFull);
    return () => {
      clearTimeout(timer);
      delete root.dataset.cursorIdle;
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('fullscreenchange', onFull);
      document.removeEventListener('webkitfullscreenchange', onFull);
    };
  }, [touch]);

  if ((!touch && !moving) || full || !canFull()) return null;

  return (
    <button type="button" className={touch ? `${styles.full} ${styles.touch}` : styles.full} onClick={goFull}>
      {label}
    </button>
  );
}
