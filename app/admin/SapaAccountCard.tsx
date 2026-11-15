'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';

import { sapa } from '@/content/th/sapa';

import styles from './admin.module.css';
import { send } from './send';

/**
 * The พี่สภา team's shared password, for answering ระบาย at /sapa. Like the booth's:
 * shown here once when it is made, stored only as a hash, and a new one signs the
 * whole team out. Also says whether Discord pings are set up.
 */
export function SapaAccountCard({
  hasPassword,
  changedAt,
  discord,
}: {
  hasPassword: boolean;
  /** Already formatted for a Thai reader, or empty. */
  changedAt: string;
  discord: 'bot' | 'webhook' | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [fresh, setFresh] = useState<string | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [test, setTest] = useState<{ text: string; ok: boolean } | null>(null);

  async function testPing() {
    setBusy(true);
    setTest({ text: sapa.admin.testing, ok: true });
    const r = await send('/api/admin/discord-test', 'POST', {});
    setBusy(false);
    const reason = (r.data?.ok ? 'ok' : r.data?.reason) as keyof typeof sapa.admin.testResult | undefined;
    const text = reason && reason in sapa.admin.testResult ? sapa.admin.testResult[reason] : 'ทำไม่สำเร็จ ลองใหม่อีกที';
    setTest({ text: r.data?.status ? `${text} (Discord ${String(r.data.status)})` : text, ok: Boolean(r.data?.ok) });
  }

  async function choose(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const password = String(new FormData(form).get('password') ?? '');
    if (hasPassword && !window.confirm(sapa.admin.confirmGenerate)) return;
    setBusy(true);
    setFailed(null);
    setSaved(false);
    setFresh(null);
    const r = await send('/api/admin/sapa-account', 'POST', { password });
    setBusy(false);
    if (r.ok) {
      form.reset();
      setSaved(true);
      router.refresh();
    } else {
      setFailed(r.status === 400 ? sapa.admin.badPassword : 'ทำไม่สำเร็จ ลองใหม่อีกที');
    }
  }

  async function generate() {
    if (hasPassword && !window.confirm(sapa.admin.confirmGenerate)) return;
    setBusy(true);
    setFailed(null);
    setSaved(false);
    const r = await send('/api/admin/sapa-account', 'POST', {});
    setBusy(false);
    if (r.ok && typeof r.data?.password === 'string') {
      setFresh(r.data.password);
      router.refresh();
    } else {
      setFailed('ทำไม่สำเร็จ ลองใหม่อีกที');
    }
  }

  return (
    <section className={styles.card} aria-labelledby="sapa-h">
      <h2 id="sapa-h">{sapa.admin.heading}</h2>
      <p className={styles.hint}>{sapa.admin.hint}</p>

      <div className={styles.row}>
        <button className={styles.button} type="button" onClick={generate} disabled={busy}>
          {sapa.admin.generate}
        </button>
        <a className={`${styles.button} ${styles.buttonQuiet}`} href="/sapa">
          {sapa.admin.open}
        </a>
        <span className={styles.hint} style={{ margin: 0 }}>
          {hasPassword ? `${sapa.admin.isSet}${changedAt ? ` · ${sapa.admin.changedAt} ${changedAt}` : ''}` : ''}
        </span>
      </div>

      <form className={styles.row} style={{ marginTop: 10 }} onSubmit={choose}>
        <label className={styles.field} style={{ flex: '1 1 200px' }}>
          {sapa.admin.choose}
          <input
            className={styles.input}
            name="password"
            type="text"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            minLength={8}
            maxLength={100}
            required
            placeholder={sapa.admin.chooseHint}
          />
        </label>
        <button className={`${styles.button} ${styles.buttonQuiet}`} type="submit" disabled={busy}>
          {sapa.admin.save}
        </button>
      </form>

      <div className={styles.row} style={{ marginTop: 10 }}>
        <span className={styles.hint} style={{ margin: 0 }}>
          {discord ? sapa.admin.discord[discord] : sapa.admin.discord.none}
        </span>
        <button className={`${styles.button} ${styles.buttonQuiet}`} type="button" onClick={() => void testPing()} disabled={busy}>
          {sapa.admin.test}
        </button>
      </div>
      {test && <p className={`${styles.msg} ${test.ok ? styles.ok : styles.bad}`}>{test.text}</p>}

      {fresh && (
        <div className={styles.secret} role="status">
          <strong>{sapa.admin.newPassword}</strong>
          <span className={styles.secretValue}>{fresh}</span>
          <span className={styles.hint} style={{ margin: 0 }}>
            {sapa.admin.shownOnce}
          </span>
        </div>
      )}
      {saved && <p className={`${styles.msg} ${styles.ok}`}>{sapa.admin.saved}</p>}
      {failed && <p className={`${styles.msg} ${styles.bad}`}>{failed}</p>}
    </section>
  );
}
