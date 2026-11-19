import type { Metadata } from 'next';
import { connection } from 'next/server';

import { KeepAwake } from '@/components/booth/KeepAwake';
import { TvControls } from '@/components/booth/TvControls';
import { FestivalRiver, FestivalSky } from '@/components/festival/registry';
import { tv } from '@/content/th/booth';
import { siteUrl } from '@/lib/site-url';

import styles from '../greeting/greeting.module.css';
import { QrScene } from '../greeting/QrScene';

export const metadata: Metadata = {
  title: 'สแกนเลย',
  robots: { index: false },
  appleWebApp: { capable: true, title: 'QR', statusBarStyle: 'black-translucent' },
};

/**
 * /qr: only the main site's QR code, over the greeting's night sky, for staff to
 * hold up to people at the event on a phone or iPad (or put on a second screen).
 */
export default async function QrPage() {
  // The address comes from the request (or PUBLIC_SITE_URL), so never prerendered.
  await connection();
  const url = await siteUrl('/');
  return (
    <main className={styles.stage} data-festival="loykrathong">
      <KeepAwake />
      <TvControls label={tv.fullscreen} touch />
      <div className={styles.sky}>
        <FestivalSky id="loykrathong" lanterns />
      </div>
      <div className={styles.river}>
        <FestivalRiver id="loykrathong" moon={false} />
      </div>
      <div className={styles.solo}>
        <QrScene url={url} />
      </div>
    </main>
  );
}
