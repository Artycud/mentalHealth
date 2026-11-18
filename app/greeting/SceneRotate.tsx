'use client';

import { useEffect, useState, type ReactNode } from 'react';

import styles from './greeting.module.css';

/**
 * Takes turns between the greeting's scenes, crossfading over the shared sky and
 * river. Each scene stays mounted (only hidden), so a switch never reloads its art.
 */
export function SceneRotate({ scenes, seconds = 12 }: { scenes: ReactNode[]; seconds?: number }) {
  const [on, setOn] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setOn((i) => (i + 1) % scenes.length), seconds * 1000);
    return () => clearInterval(id);
  }, [scenes.length, seconds]);

  return scenes.map((scene, i) => (
    <div key={i} className={styles.scene} data-on={i === on ? '' : undefined} aria-hidden={i !== on}>
      {scene}
    </div>
  ));
}
