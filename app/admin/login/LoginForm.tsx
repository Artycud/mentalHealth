'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';

import { admin } from '@/content/th/admin';

import styles from '../admin.module.css';
import { send } from '../send';

export function LoginForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setBusy(true);
    setError('');
    const r = await send('/api/admin/login', 'POST', {
      username: String(form.get('username') ?? ''),
      password: String(form.get('password') ?? ''),
    });
    if (r.ok) {
      router.replace('/admin');
      router.refresh();
      return;
    }
    setBusy(false);
    setError(
      r.status === 429
        ? admin.login.locked
        : r.status === 401
          ? admin.login.wrong
          : r.status === 503
            ? admin.login.notConfigured
            : admin.login.network,
    );
  }

  return (
    <form className={styles.loginForm} onSubmit={submit}>
      <label className={styles.field}>
        {admin.login.username}
        <input className={styles.input} name="username" autoComplete="username" autoCapitalize="none" spellCheck={false} required autoFocus />
      </label>
      <label className={styles.field}>
        {admin.login.password}
        <input className={styles.input} name="password" type="password" autoComplete="current-password" required />
      </label>
      <button className={styles.button} type="submit" disabled={busy}>
        {busy ? admin.login.working : admin.login.submit}
      </button>
      <p className={`${styles.msg} ${styles.bad}`} role="alert">
        {error}
      </p>
    </form>
  );
}
