'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { admin, WIPE_WORD } from '@/content/th/admin';

import styles from './admin.module.css';
import { send } from './send';

/**
 * Delete everything (BRIEF §11), for when the school report is done. Nothing happens
 * until a person has typed the confirmation word, so a stray tap cannot do it. The
 * live festival, the dates and both accounts are kept.
 */
export function DangerZone() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [word, setWord] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; bad?: boolean } | null>(null);
  const matches = word.trim() === WIPE_WORD;

  async function wipe() {
    if (!matches) return;
    setBusy(true);
    const r = await send('/api/admin/wipe', 'POST', { confirm: word });
    setBusy(false);
    if (r.ok) {
      setMessage({ text: admin.danger.done(Number(r.data?.removed ?? 0)) });
      setWord('');
      setOpen(false);
      router.refresh();
    } else {
      setMessage({ text: r.status === 400 ? admin.danger.wrongWord : admin.errors.generic, bad: true });
    }
  }

  return (
    <section className={styles.card} aria-labelledby="danger-h">
      <h2 id="danger-h">{admin.danger.heading}</h2>
      <p className={styles.hint}>{admin.danger.hint}</p>
      {!open ? (
        <button type="button" className={`${styles.button} ${styles.buttonDanger}`} onClick={() => setOpen(true)}>
          {admin.danger.wipe}
        </button>
      ) : (
        <div className={styles.row}>
          <label className={styles.field} style={{ flex: '1 1 260px' }}>
            {admin.danger.typeToConfirm}
            <input className={styles.input} value={word} onChange={(e) => setWord(e.target.value)} autoComplete="off" spellCheck={false} name="confirm" />
          </label>
          <button type="button" className={`${styles.button} ${styles.buttonDanger}`} disabled={!matches || busy} onClick={wipe}>
            {admin.danger.confirmButton}
          </button>
          <button type="button" className={styles.linkButton} onClick={() => { setOpen(false); setWord(''); }}>
            {admin.danger.cancel}
          </button>
        </div>
      )}
      <p className={`${styles.msg} ${message?.bad ? styles.bad : styles.ok}`} role="status">
        {message?.text}
      </p>
    </section>
  );
}
