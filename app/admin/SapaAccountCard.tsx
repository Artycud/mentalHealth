'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

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
  const [failed, setFailed] = useState(false);

  async function generate() {
    if (hasPassword && !window.confirm(sapa.admin.confirmGenerate)) return;
    setBusy(true);
    setFailed(false);
    const r = await send('/api/admin/sapa-account', 'POST', {});
    setBusy(false);
    if (r.ok && typeof r.data?.password === 'string') {
      setFresh(r.data.password);
      router.refresh();
    } else {
      setFailed(true);
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

      <p className={styles.hint} style={{ marginTop: 10 }}>
        {discord ? sapa.admin.discord[discord] : sapa.admin.discord.none}
      </p>

      {fresh && (
        <div className={styles.secret} role="status">
          <strong>{sapa.admin.newPassword}</strong>
          <span className={styles.secretValue}>{fresh}</span>
          <span className={styles.hint} style={{ margin: 0 }}>
            {sapa.admin.shownOnce}
          </span>
        </div>
      )}
      {failed && <p className={`${styles.msg} ${styles.bad}`}>ทำไม่สำเร็จ ลองใหม่อีกที</p>}
    </section>
  );
}
