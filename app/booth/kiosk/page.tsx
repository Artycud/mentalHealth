import { connection } from 'next/server';

import { festivals } from '@/content/th/booth';
import { errors } from '@/content/th/common';
import { getWallData } from '@/lib/booth-wall';
import { getEventText } from '@/lib/events';
import { requireBooth } from '@/lib/guard';
import { getActiveFestival } from '@/lib/settings';
import { siteUrl } from '@/lib/site-url';

import { Kiosk } from './Kiosk';
import styles from './kiosk.module.css';

/**
 * The booth's answering device. Paired with /booth/display on the TV.
 *
 * Behind the booth login once the admin has generated a booth password (until
 * then it is open, so a fresh install works at once); see lib/guard.ts and
 * BRIEF §11. It writes sessions exactly as a student's phone does, anonymously.
 */
export default async function BoothKioskPage() {
  // Which booth is live, and when it runs, can change at any moment from the admin
  // panel, so this page is built per request and never prerendered. (`connection`
  // is how Next.js says so; the database read below does not, by itself.)
  await connection();
  await requireBooth('/booth/kiosk');
  const active = await getActiveFestival();
  const theme = active === 'none' ? undefined : festivals[active];

  if (active === 'none' || !theme?.ready) {
    return (
      <main className={styles.stage}>
        <div className={styles.body}>
          <h1 className={styles.question}>{errors.noBooth.title}</h1>
          <p className={styles.resultBody}>{errors.noBooth.body}</p>
        </div>
      </main>
    );
  }

  // Today's flowers so far, for the staff's stock line (the same anonymous counts
  // the TV shows), and the main site's address for the result's QR code.
  const [event, wall, qrUrl] = await Promise.all([getEventText(active), getWallData(active), siteUrl('/')]);
  return <Kiosk theme={theme} event={event} stock={wall.flowers} qrUrl={qrUrl} />;
}
