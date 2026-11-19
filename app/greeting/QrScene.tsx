import { QrCode } from '@/components/booth/QrCode';
import { LoyKrathongMoon } from '@/components/festival/loykrathong/Moon';
import { Wordmark } from '@/components/illustrations/icons';
import { qrInvite } from '@/content/th/booth';
import { common } from '@/content/th/common';
import { greeting as g } from '@/content/th/greeting';

import styles from './greeting.module.css';

/**
 * The main site's QR code, big enough to scan from a few steps away: a scene on
 * the entrance TV (/greeting) and the whole of /qr, for staff to hold up on a
 * phone or iPad. `url` is the site's own address (lib/site-url.ts).
 */
export function QrScene({ url }: { url: string }) {
  return (
    <div className={styles.qrScene}>
      <span className={styles.offersMoon} aria-hidden="true">
        <LoyKrathongMoon />
      </span>
      <p className={styles.brandSmall}>
        <Wordmark />
        {common.wordmark}
      </p>
      <div className={styles.qrBody}>
        <div className={styles.qrCard}>
          <QrCode value={url} label={qrInvite.title} />
        </div>
        <div className={styles.qrText}>
          <p className={styles.qrKicker}>{g.qr.kicker}</p>
          <h2 className={`${styles.qrTitle} ${styles.gold}`}>{qrInvite.title}</h2>
          <p className={styles.qrLine}>{qrInvite.body}</p>
          <p className={styles.qrUrl}>{url.replace(/^https?:\/\//, '').replace(/\/$/, '')}</p>
          <p className={styles.qrNote}>{g.qr.noName}</p>
        </div>
      </div>
    </div>
  );
}
