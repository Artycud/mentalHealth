'use client';

import { useEffect, useState } from 'react';

import styles from './TvControls.module.css';

const IDLE_MS = 3000;

/**
 * For a TV driven by a laptop: the mouse pointer hides itself after a few seconds
 * still, and a small "full screen" button appears only while the mouse moves and
 * the page is not already full screen. (Going full screen needs a click: a browser
 * will not do it on its own.) On a smart TV or an iPad with no mouse, none of this
 * ever shows.
 */
export function TvControls({ label }: { label: string }) {
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
    const onFull = () => setFull(!!document.fullscreenElement);
    onFull();
    root.dataset.cursorIdle = 'true';
    window.addEventListener('mousemove', onMove);
    document.addEventListener('fullscreenchange', onFull);
    return () => {
      clearTimeout(timer);
      delete root.dataset.cursorIdle;
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('fullscreenchange', onFull);
    };
  }, []);

  if (!moving || full || !document.fullscreenEnabled) return null;

  return (
    <button
      type="button"
      className={styles.full}
      onClick={() => void document.documentElement.requestFullscreen().catch(() => {})}
    >
      {label}
    </button>
  );
}
