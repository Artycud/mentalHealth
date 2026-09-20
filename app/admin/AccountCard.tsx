'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';

import { admin } from '@/content/th/admin';

import styles from './admin.module.css';
import { send } from './send';

/**
 * The admin's own account (BRIEF §11): the username, and a way to change the password
 * without a terminal. A password set by the server's environment is changed there, so
 * the form is not offered.
 */
export function AccountCard({ username, managedByServer }: { username: string; managedByServer: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; bad?: boolean } | null>(null);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const next = String(f.get('next') ?? '');
    if (next !== String(f.get('again') ?? '')) {
      setMessage({ text: admin.account.mismatch, bad: true });
      return;
    }
    setBusy(true);
    setMessage({ text: admin.account.saving });
    const r = await send('/api/admin/account', 'POST', { currentPassword: String(f.get('current') ?? ''), newPassword: next });
    setBusy(false);
    if (r.ok) {
      form.reset();
      setMessage({ text: admin.account.saved });
      router.refresh();
      return;
    }
    const code = r.data?.error;
    setMessage({
      text: code === 'wrong_password' ? admin.account.wrongCurrent : code === 'weak_password' ? admin.account.weak : code === 'locked' ? admin.account.locked : admin.errors.generic,
      bad: true,
    });
  }

  return (
    <section className={styles.card} aria-labelledby="account-h">
      <h2 id="account-h">{admin.account.heading}</h2>
      <p className={styles.hint}>
        {admin.account.username}: <strong>{username}</strong>
      </p>
      {managedByServer ? (
        <p className={styles.note}>{admin.account.managed}</p>
      ) : (
        <form className={styles.loginForm} onSubmit={submit}>
          <p className={styles.hint} style={{ margin: 0 }}>{admin.account.hint}</p>
          <label className={styles.field}>
            {admin.account.current}
            <input className={styles.input} name="current" type="password" autoComplete="current-password" required />
          </label>
          <label className={styles.field}>
            {admin.account.next}
            <input className={styles.input} name="next" type="password" autoComplete="new-password" required />
          </label>
          <label className={styles.field}>
            {admin.account.again}
            <input className={styles.input} name="again" type="password" autoComplete="new-password" required />
          </label>
          <div>
            <button className={styles.button} type="submit" disabled={busy}>
              {admin.account.save}
            </button>
          </div>
        </form>
      )}
      <p className={`${styles.msg} ${message?.bad ? styles.bad : styles.ok}`} role="status">
        {message?.text}
      </p>
    </section>
  );
}
