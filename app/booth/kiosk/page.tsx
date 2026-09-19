import { connection } from 'next/server';

import { festivals } from '@/content/th/booth';
import { errors } from '@/content/th/common';
import { getEventText } from '@/lib/events';
import { getActiveFestival } from '@/lib/settings';

import { Kiosk } from './Kiosk';
import styles from './kiosk.module.css';

/**
 * The booth's answering device. Paired with /booth/display on the TV.
 *
 * PHASE 2: no login yet and no session write. Both land in phase 4, when there
 * is a database to hold the booth account's hashed password and the sessions.
 * See BRIEF.md for the agreed booth-account design.
 */
export default async function BoothKioskPage() {
  // Which booth is live, and when it runs, can change at any moment from the admin
  // panel, so this page is built per request and never prerendered. (`connection`
  // is how Next.js says so; the database read below does not, by itself.)
  await connection();
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

  return <Kiosk theme={theme} event={await getEventText(active)} />;
}
