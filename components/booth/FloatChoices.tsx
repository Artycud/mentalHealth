'use client';

import { useRef } from 'react';

import type { BoothScene } from '@/content/th/booth';

import styles from './FloatChoices.module.css';

interface Choice {
  id: string;
  label: string;
}

/**
 * The kiosk's answers: six slips of paper. Tap one, or flick it upward, and it
 * lights up and floats away like a lantern before the next question comes in,
 * the booth's own idea of letting go. The other slips step back while it goes.
 *
 * A flick only ever moves a slip up, and a short or sideways one springs back, so
 * a hand resting on the screen never answers by accident. A plain tap answers
 * too: nobody has to discover the flick.
 *
 * Only transform and opacity move, so an old iPad keeps up (BRIEF §9).
 */
export function FloatChoices({
  choices,
  scene,
  picked,
  onPick,
  label,
}: {
  choices: Choice[];
  scene: BoothScene;
  /** The slip just chosen, floating away; null while the student is choosing. */
  picked: string | null;
  onPick: (id: string) => void;
  /** The question, for screen readers. */
  label: string;
}) {
  const drag = useRef<{ id: string; y: number; x: number; el: HTMLButtonElement; dy: number } | null>(null);

  const release = (el: HTMLButtonElement) => {
    el.style.transition = '';
    el.style.transform = '';
  };

  return (
    <div className={styles.slips} role="group" aria-label={label} data-picking={picked ? 'true' : undefined}>
      {choices.map((choice, i) => (
        <button
          key={choice.id}
          type="button"
          className={styles.slip}
          data-picked={picked === choice.id ? 'true' : undefined}
          data-i={i}
          aria-pressed={picked === choice.id}
          disabled={picked !== null && picked !== choice.id}
          onPointerDown={(e) => {
            if (picked) return;
            e.currentTarget.setPointerCapture(e.pointerId);
            e.currentTarget.style.transition = 'none';
            drag.current = { id: choice.id, y: e.clientY, x: e.clientX, el: e.currentTarget, dy: 0 };
          }}
          onPointerMove={(e) => {
            const d = drag.current;
            if (!d || d.id !== choice.id) return;
            // Up only, and a little stiff, like paper lifting off a table.
            d.dy = Math.min(0, e.clientY - d.y) * 0.85;
            d.el.style.transform = `translate3d(0, ${d.dy.toFixed(1)}px, 0) rotate(${(d.dy * -0.03).toFixed(2)}deg)`;
          }}
          onPointerUp={(e) => {
            const d = drag.current;
            drag.current = null;
            if (!d || d.id !== choice.id) return;
            const moved = Math.hypot(e.clientX - d.x, e.clientY - d.y);
            // A tap (barely moved) or a real flick up both answer; anything else springs back.
            if (moved < 10 || d.dy < -45) onPick(choice.id);
            else release(d.el);
          }}
          onPointerCancel={() => {
            const d = drag.current;
            drag.current = null;
            if (d) release(d.el);
          }}
          onClick={(e) => {
            // Keyboard and screen readers: Enter/Space arrive as a click with no pointer.
            if (e.detail === 0 && !picked) onPick(choice.id);
          }}
        >
          <span className={styles.icon} aria-hidden="true">
            <SceneIcon scene={scene} />
          </span>
          <span className={styles.label}>{choice.label}</span>
        </button>
      ))}
    </div>
  );
}

/** Each question's small picture on its slips. Drawn in the slip's ink. */
function SceneIcon({ scene }: { scene: BoothScene }) {
  switch (scene) {
    case 'krathong':
      return (
        <svg viewBox="0 0 32 32">
          <path d="M5 20 H27 Q25 26 16 26 Q7 26 5 20 Z" className={styles.fillSoft} />
          <path d="M9 20 Q8 13 13 11 Q13 16 16 20 Q19 16 19 11 Q24 13 23 20" className={styles.fill} />
          <path d="M16 6 V11" className={styles.stroke} />
        </svg>
      );
    case 'candle':
      return (
        <svg viewBox="0 0 32 32">
          <rect x="12" y="14" width="8" height="13" rx="2" className={styles.fillSoft} />
          <path d="M16 4 Q20.5 9 16 13 Q11.5 9 16 4 Z" className={styles.flame} />
        </svg>
      );
    case 'drift':
      return (
        <svg viewBox="0 0 32 32">
          <path d="M11 15 H21 Q20 18 16 18 Q12 18 11 15 Z" className={styles.fill} />
          <path d="M3 22 Q7.5 19 12 22 T21 22 T30 22" className={styles.stroke} />
          <path d="M6 27 Q10.5 24 15 27 T24 27" className={styles.strokeSoft} />
        </svg>
      );
    case 'sunrise':
      return (
        <svg viewBox="0 0 32 32">
          <path d="M8 22 A8 8 0 0 1 24 22 Z" className={styles.flame} />
          <path d="M3 22 H29 M16 6 V10 M6.5 10.5 L9 13 M25.5 10.5 L23 13" className={styles.stroke} />
        </svg>
      );
    case 'river':
      return (
        <svg viewBox="0 0 32 32">
          <circle cx="18" cy="12" r="7" className={styles.fillSoft} />
          <circle cx="9" cy="21" r="2.6" className={styles.fillSoft} />
          <circle cx="5" cy="26" r="1.5" className={styles.fillSoft} />
        </svg>
      );
  }
}
