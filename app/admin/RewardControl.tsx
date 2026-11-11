'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { admin } from '@/content/th/admin';

import styles from './admin.module.css';
import { send } from './send';

/**
 * The booth's coupon: still being given out, or gone. The TV leads with the coupon
 * in big type, so the moment the booth runs out this is switched off, and the TV
 * and kiosk stop promising one (they pick it up on their next refresh).
 */
export function RewardControl({ on, reward }: { on: boolean; reward: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; bad?: boolean } | null>(null);
  const t = admin.reward;

  async function choose(next: boolean) {
    if (next === on || busy) return;
    if (!window.confirm(next ? t.confirmOn : t.confirmOff)) return;
    setBusy(true);
    setMessage(null);
    const r = await send('/api/admin/reward', 'POST', { on: next });
    setBusy(false);
    if (r.ok) {
      setMessage({ text: t.saved });
      router.refresh();
    } else {
      setMessage({ text: admin.errors.generic, bad: true });
    }
  }

  const options = [
    { value: true, label: t.on },
    { value: false, label: t.off },
  ];

  return (
    <section className={styles.card} aria-labelledby="reward-h">
      <h2 id="reward-h">{t.heading}</h2>
      <p className={styles.hint}>{t.hint(reward)}</p>
      <fieldset className={styles.choices} disabled={busy}>
        <legend style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>
          {t.heading}
        </legend>
        {options.map((o) => (
          <button
            key={o.label}
            type="button"
            role="radio"
            aria-checked={o.value === on}
            className={`${styles.choice} ${o.value === on ? styles.choiceOn : ''}`}
            onClick={() => choose(o.value)}
          >
            {o.label}
          </button>
        ))}
      </fieldset>
      <p className={`${styles.msg} ${message?.bad ? styles.bad : styles.ok}`} role="status">
        {message?.text}
      </p>
    </section>
  );
}
