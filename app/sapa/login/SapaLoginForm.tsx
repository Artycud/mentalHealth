'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';

import { sapa } from '@/content/th/sapa';

import styles from '../../booth/login/login.module.css';

/** The team's sign-in: one field, the shared password. */
export function SapaLoginForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const password = String(new FormData(e.currentTarget).get('password') ?? '');
    setBusy(true);
    setError('');
    let status = 0;
    try {
      const res = await fetch('/api/sapa/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      status = res.status;
    } catch {
      /* status stays 0: no connection */
    }
    if (status === 200) {
      router.replace('/sapa');
      router.refresh();
      return;
    }
    setBusy(false);
    setError(status === 429 ? sapa.login.locked : status === 401 ? sapa.login.wrong : status === 409 ? sapa.login.notReady : sapa.login.network);
  }

  return (
    <form className={styles.form} onSubmit={submit}>
      <label className={styles.field}>
        {sapa.login.password}
        <input className={styles.input} name="password" type="text" autoComplete="off" autoCapitalize="none" autoCorrect="off" spellCheck={false} required autoFocus />
      </label>
      <button className={styles.button} type="submit" disabled={busy}>
        {busy ? sapa.login.working : sapa.login.submit}
      </button>
      <p className={styles.error} role="alert">
        {error}
      </p>
    </form>
  );
}
