'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';

import { admin } from '@/content/th/admin';

import styles from './login.module.css';

/** The booth devices' sign-in. Big fields and one big button: it is used on an iPad. */
export function BoothLoginForm({ next }: { next: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setBusy(true);
    setError('');
    let status = 0;
    try {
      const res = await fetch('/api/booth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: String(form.get('username') ?? ''), password: String(form.get('password') ?? '') }),
      });
      status = res.status;
    } catch {
      /* status stays 0: a dead connection */
    }
    if (status === 200) {
      router.replace(next);
      router.refresh();
      return;
    }
    setBusy(false);
    setError(status === 429 ? admin.boothLogin.locked : status === 401 ? admin.boothLogin.wrong : status === 409 || status === 503 ? admin.boothLogin.notReady : admin.boothLogin.network);
  }

  return (
    <form className={styles.form} onSubmit={submit}>
      <label className={styles.field}>
        {admin.boothLogin.username}
        <input className={styles.input} name="username" autoComplete="username" autoCapitalize="none" autoCorrect="off" spellCheck={false} required autoFocus />
      </label>
      <label className={styles.field}>
        {admin.boothLogin.password}
        <input className={styles.input} name="password" type="text" autoComplete="off" autoCapitalize="none" autoCorrect="off" spellCheck={false} required />
      </label>
      <button className={styles.button} type="submit" disabled={busy}>
        {busy ? admin.boothLogin.working : admin.boothLogin.submit}
      </button>
      <p className={styles.error} role="alert">
        {error}
      </p>
    </form>
  );
}
