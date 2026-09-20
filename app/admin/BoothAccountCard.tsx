'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';

import { admin } from '@/content/th/admin';

import styles from './admin.module.css';
import { send } from './send';

/**
 * The account the kiosk and the TV sign in with (BRIEF §11). A new password is shown
 * here once, at the moment it is made, and stored only as a hash: nobody can read it
 * back afterwards, so forgetting it means making another.
 */
export function BoothAccountCard({
  username,
  hasPassword,
  changedAt,
}: {
  username: string;
  hasPassword: boolean;
  /** Already formatted for a Thai reader, or empty. */
  changedAt: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; bad?: boolean } | null>(null);
  const [fresh, setFresh] = useState<string | null>(null);

  async function saveName(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const name = String(new FormData(e.currentTarget).get('username') ?? '').trim();
    setBusy(true);
    const r = await send('/api/admin/booth-account', 'POST', { username: name });
    setBusy(false);
    if (r.ok) {
      setMessage({ text: admin.booth.saved });
      router.refresh();
    } else {
      setMessage({ text: r.status === 400 ? admin.booth.badName : admin.errors.generic, bad: true });
    }
  }

  async function generate() {
    if (hasPassword && !window.confirm(admin.booth.confirmGenerate)) return;
    setBusy(true);
    setMessage(null);
    const r = await send('/api/admin/booth-account', 'POST', { regenerate: true });
    setBusy(false);
    if (r.ok && typeof r.data?.password === 'string') {
      setFresh(r.data.password);
      router.refresh();
    } else {
      setMessage({ text: admin.errors.generic, bad: true });
    }
  }

  return (
    <section className={styles.card} aria-labelledby="booth-h">
      <h2 id="booth-h">{admin.booth.heading}</h2>
      <p className={styles.hint}>{admin.booth.hint}</p>

      <form className={styles.row} onSubmit={saveName}>
        <label className={styles.field} style={{ flex: '1 1 160px' }}>
          {admin.booth.username}
          <input className={styles.input} name="username" defaultValue={username} autoCapitalize="none" spellCheck={false} maxLength={24} />
        </label>
        <button className={`${styles.button} ${styles.buttonQuiet}`} type="submit" disabled={busy}>
          {admin.booth.saveName}
        </button>
      </form>

      <div className={styles.row} style={{ marginTop: 10 }}>
        <button className={styles.button} type="button" onClick={generate} disabled={busy}>
          {admin.booth.generate}
        </button>
        <span className={styles.hint} style={{ margin: 0 }}>
          {hasPassword ? `${admin.booth.isSet}${changedAt ? ` · ${admin.booth.changedAt} ${changedAt}` : ''}` : ''}
        </span>
      </div>

      {fresh && (
        <div className={styles.secret} role="status">
          <strong>{admin.booth.newPassword}</strong>
          <span className={styles.secretValue} data-testid="booth-password">
            {fresh}
          </span>
          <span className={styles.hint} style={{ margin: 0 }}>
            {admin.booth.shownOnce}
          </span>
        </div>
      )}

      <p className={`${styles.msg} ${message?.bad ? styles.bad : styles.ok}`} role="status">
        {message?.text}
      </p>
    </section>
  );
}
