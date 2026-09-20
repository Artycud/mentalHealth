'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { admin } from '@/content/th/admin';

import styles from './admin.module.css';
import { send } from './send';

export interface ThemeOption {
  id: string;
  name: string;
  /** False while the festival has no quiz or results, so students would see "no booth". */
  ready: boolean;
}

/**
 * Which booth is live (BRIEF §11). One clear control with the live one marked;
 * changing it asks first, and takes effect on the next student page load.
 */
export function ThemeControl({ live, options }: { live: string; options: ThemeOption[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; bad?: boolean } | null>(null);

  const current = options.find((o) => o.id === live);
  const noContent = current && !current.ready && live !== 'none';

  async function choose(option: ThemeOption) {
    if (option.id === live || busy) return;
    if (!window.confirm(admin.theme.confirm(option.name))) return;
    setBusy(true);
    setMessage(null);
    const r = await send('/api/admin/festival', 'POST', { festival: option.id });
    setBusy(false);
    if (r.ok) {
      setMessage({ text: admin.theme.saved });
      router.refresh();
    } else {
      setMessage({ text: admin.errors.generic, bad: true });
    }
  }

  return (
    <section className={styles.card} aria-labelledby="theme-h">
      <h2 id="theme-h">{admin.theme.heading}</h2>
      <p className={styles.hint}>{admin.theme.hint}</p>
      <fieldset className={styles.choices} disabled={busy}>
        <legend style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>
          {admin.theme.heading}
        </legend>
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={o.id === live}
            className={`${styles.choice} ${o.id === live ? styles.choiceOn : ''}`}
            onClick={() => choose(o)}
          >
            {o.name}
            {o.id === live && <span className={styles.tag}>{admin.theme.live}</span>}
          </button>
        ))}
      </fieldset>
      {noContent && <p className={styles.note}>{admin.theme.noContent}</p>}
      <p className={`${styles.msg} ${message?.bad ? styles.bad : styles.ok}`} role="status">
        {message?.text}
      </p>
    </section>
  );
}
