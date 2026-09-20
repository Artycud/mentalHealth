'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';

import { admin } from '@/content/th/admin';

import styles from '../admin.module.css';
import { send } from '../send';

/** The first-time form: a username, a password twice, and (on a live server) the setup code. */
export function SetupForm({ needsCode }: { needsCode: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const password = String(f.get('password') ?? '');
    if (password !== String(f.get('again') ?? '')) {
      setError(admin.setup.mismatch);
      return;
    }
    setBusy(true);
    setError('');
    const r = await send('/api/admin/setup', 'POST', {
      username: String(f.get('username') ?? ''),
      password,
      code: needsCode ? String(f.get('code') ?? '') : undefined,
    });
    if (r.ok) {
      router.replace('/admin');
      router.refresh();
      return;
    }
    setBusy(false);
    const code = r.data?.error;
    setError(
      code === 'bad_username' ? admin.setup.badUsername
        : code === 'weak_password' ? admin.setup.weak
          : code === 'bad_code' ? admin.setup.badCode
            : code === 'locked' ? admin.setup.locked
              : code === 'already_set' ? admin.setup.already
                : admin.errors.generic,
    );
  }

  return (
    <form className={styles.loginForm} onSubmit={submit}>
      <label className={styles.field}>
        {admin.setup.username}
        <input className={styles.input} name="username" autoComplete="username" autoCapitalize="none" spellCheck={false} required autoFocus maxLength={32} />
        <span className={styles.hint} style={{ margin: 0 }}>{admin.setup.usernameHint}</span>
      </label>
      <label className={styles.field}>
        {admin.setup.password}
        <input className={styles.input} name="password" type="password" autoComplete="new-password" required />
        <span className={styles.hint} style={{ margin: 0 }}>{admin.setup.passwordHint}</span>
      </label>
      <label className={styles.field}>
        {admin.setup.again}
        <input className={styles.input} name="again" type="password" autoComplete="new-password" required />
      </label>
      {needsCode && (
        <label className={styles.field}>
          {admin.setup.code}
          <input className={styles.input} name="code" autoComplete="off" autoCapitalize="none" spellCheck={false} required maxLength={20} />
          <span className={styles.hint} style={{ margin: 0 }}>{admin.setup.codeHint}</span>
        </label>
      )}
      <button className={styles.button} type="submit" disabled={busy}>
        {busy ? admin.setup.working : admin.setup.submit}
      </button>
      <p className={`${styles.msg} ${styles.bad}`} role="alert">
        {error}
      </p>
    </form>
  );
}
