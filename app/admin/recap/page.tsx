import Link from 'next/link';
import { connection } from 'next/server';

import { Wordmark } from '@/components/illustrations/icons';
import { festivals } from '@/content/th/booth';
import { recap as t } from '@/content/th/recap';
import { formatDateRange, parseIsoDate } from '@/lib/thai-date';
import { requireAdminPage } from '@/lib/guard';
import { demoRecap, getRecap, RECAP_OKAY_MIN } from '@/lib/recap';
import { getActiveFestival } from '@/lib/settings';
import { siteUrl } from '@/lib/site-url';
import type { FestivalId } from '@/lib/types';

import styles from '../admin.module.css';
import own from './recap.module.css';
import { RecapStudio } from './RecapStudio';

/**
 * The booth's day as Instagram cards (BRIEF, decisions: "Booth recap for Instagram").
 * Admin only. The numbers are the same anonymous totals as the dashboard; the cards
 * are drawn in the browser (./draw.ts).
 *
 * ?day=YYYY-MM-DD picks one Thailand day (default: the latest with a finished booth
 * session); ?day=all is every day of the booth. ?festival= picks a booth other than
 * the live one. ?demo=1 shows invented numbers, outside production only.
 */
export default async function RecapPage(props: PageProps<'/admin/recap'>) {
  await connection();
  await requireAdminPage();

  const q = await props.searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const live = await getActiveFestival();
  const asked = one(q.festival);
  const festival: FestivalId | null =
    asked && Object.hasOwn(festivals, asked) ? (asked as FestivalId) : live === 'none' ? null : live;
  const showDemo = one(q.demo) === '1' && process.env.NODE_ENV !== 'production';

  const head = (
    <header className={styles.head}>
      <div className={styles.brand}>
        <Wordmark />
        CUD Mental Health Week
        <span className={styles.brandSub}>{t.title}</span>
      </div>
      <div className={styles.headActions}>
        <Link href="/admin" className={styles.linkButton} style={{ display: 'inline-flex', alignItems: 'center' }}>
          {t.back}
        </Link>
      </div>
    </header>
  );

  if (!festival) {
    return (
      <main className={styles.wrap}>
        {head}
        <p className={styles.note}>{t.noBooth}</p>
      </main>
    );
  }

  const rawDay = one(q.day);
  const base = showDemo ? await demoRecap(festival) : await getRecap(festival, null);
  const day = rawDay === 'all' ? null : rawDay && parseIsoDate(rawDay) ? rawDay : (base.days.at(-1) ?? null);
  const data = showDemo ? base : day === null ? base : await getRecap(festival, day);
  const qrUrl = await siteUrl('/');

  const link = (d: string) => {
    const p = new URLSearchParams({ day: d });
    if (asked) p.set('festival', festival);
    if (showDemo) p.set('demo', '1');
    return `/admin/recap?${p}`;
  };

  return (
    <main className={styles.wrap}>
      {head}
      <section className={`${styles.card} ${styles.section}`}>
        <h2>
          {t.title} · บูธ{festivals[festival].name}
        </h2>
        <p className={styles.hint}>{t.intro}</p>
        {!showDemo && data.days.length > 0 && (
          <nav className={own.controls} aria-label={t.dayLabel}>
            <span className={own.label}>{t.dayLabel}</span>
            {data.days.map((d) => (
              <Link key={d} href={link(d)} className={`${own.toggle} ${d === data.day ? own.toggleOn : ''}`} aria-current={d === data.day ? 'page' : undefined}>
                {formatDateRange(d, d)}
              </Link>
            ))}
            {data.days.length > 1 && (
              <Link href={link('all')} className={`${own.toggle} ${data.day === null ? own.toggleOn : ''}`} aria-current={data.day === null ? 'page' : undefined}>
                {t.allDays}
              </Link>
            )}
          </nav>
        )}
        {data.players > 0 && !data.okay && <p className={styles.hint}>{t.okayHidden(RECAP_OKAY_MIN)}</p>}
      </section>

      {data.players === 0 ? (
        <p className={styles.note}>{t.noData}</p>
      ) : (
        <RecapStudio data={data} qrUrl={qrUrl} />
      )}
    </main>
  );
}
