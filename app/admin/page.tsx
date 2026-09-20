import Link from 'next/link';
import { connection } from 'next/server';

import { Wordmark } from '@/components/illustrations/icons';
import { admin } from '@/content/th/admin';
import { festivalOrder, festivals } from '@/content/th/booth';
import { filtersToQuery, getAdminData, parseFilters, thaiDay } from '@/lib/admin-data';
import { getBoothAccount } from '@/lib/auth';
import { getEvent } from '@/lib/events';
import { requireAdminPage } from '@/lib/guard';
import { getActiveFestival } from '@/lib/settings';

import styles from './admin.module.css';
import { BoothAccountCard } from './BoothAccountCard';
import { Charts } from './Charts';
import { DangerZone } from './DangerZone';
import { EventForms } from './EventForms';
import { Filters } from './Filters';
import { formatDuration, fullDay, thaiStamp } from './format';
import { LogoutButton } from './LogoutButton';
import { SessionList } from './SessionList';
import { ThemeControl } from './ThemeControl';

/**
 * The admin panel (BRIEF §11): the student council's one page for the school report.
 * Built per request and checked on the server every time. Anyone not signed in is sent
 * to the login page; the data is only ever read after that check.
 */
export default async function AdminPage(props: PageProps<'/admin'>) {
  await connection();
  await requireAdminPage();

  const filters = parseFilters(await props.searchParams);
  const [data, live, booth, events] = await Promise.all([
    getAdminData(filters),
    getActiveFestival(),
    getBoothAccount(),
    Promise.all(
      festivalOrder.map(async (id) => {
        const e = await getEvent(id);
        return { festival: id, name: festivals[id].name, start: e.start, end: e.end, time: e.time, place: e.place };
      }),
    ),
  ]);

  const query = filtersToQuery(filters);
  const exportHref = (kind: 'sessions' | 'answers') => `/api/admin/export${query ? `${query}&` : '?'}kind=${kind}`;
  const { summary } = data;
  const today = thaiDay(new Date().toISOString());

  return (
    <main className={styles.wrap}>
      <header className={styles.head}>
        <div className={styles.brand}>
          <Wordmark />
          CUD Mental Health Week
          <span className={styles.brandSub}>{admin.title}</span>
        </div>
        <div className={styles.headActions}>
          <Link href="/" className={styles.linkButton} style={{ display: 'inline-flex', alignItems: 'center' }}>
            {admin.backToSite}
          </Link>
          <LogoutButton />
        </div>
      </header>

      {!booth.hash && (
        <p className={styles.note} role="note">
          {admin.booth.isOpen}
          <a href="#booth-h">{admin.booth.isOpenLink}</a>
        </p>
      )}

      <div className={styles.section}>
        <ThemeControl
          live={live}
          options={[
            ...festivalOrder.map((id) => ({ id, name: festivals[id].name, ready: festivals[id].ready })),
            { id: 'none', name: admin.festivalNone, ready: true },
          ]}
        />
      </div>

      <section className={`${styles.card} ${styles.section}`} aria-labelledby="filters-h">
        <h2 id="filters-h">{admin.filters.heading}</h2>
        <Filters values={filters} />
      </section>

      <ul className={`${styles.summary} ${styles.section}`} aria-label={admin.summary.total}>
        <li className={styles.stat}>
          <div className={styles.statValue}>{summary.total}</div>
          <div className={styles.statLabel}>{admin.summary.total}</div>
        </li>
        <li className={styles.stat}>
          <div className={styles.statValue}>{summary.completed}</div>
          <div className={styles.statLabel}>{admin.summary.completed}</div>
        </li>
        <li className={styles.stat}>
          <div className={styles.statValue}>{summary.rate === null ? '–' : `${Math.round(summary.rate * 100)}%`}</div>
          <div className={styles.statLabel}>{admin.summary.rate}</div>
        </li>
        <li className={styles.stat}>
          <div className={styles.statValue}>{summary.today}</div>
          <div className={styles.statLabel}>{admin.summary.today}</div>
        </li>
        <li className={styles.stat}>
          <div className={styles.statValue}>{summary.medianSeconds === null ? '–' : formatDuration(summary.medianSeconds)}</div>
          <div className={styles.statLabel}>{admin.summary.median}</div>
        </li>
        <li className={styles.stat}>
          <div className={styles.statValue} style={{ fontSize: 14, lineHeight: 1.4, paddingTop: 4 }}>
            {summary.first && summary.last
              ? `${fullDay(thaiDay(summary.first))}${thaiDay(summary.first) === thaiDay(summary.last) ? '' : ` – ${fullDay(thaiDay(summary.last))}`}`
              : admin.summary.none}
          </div>
          <div className={styles.statLabel}>{admin.summary.range}</div>
        </li>
      </ul>

      <Charts data={data} />

      <section className={styles.section} aria-labelledby="sessions-h">
        <h2 className={styles.h2} id="sessions-h">
          {admin.sessions.heading}
        </h2>
        <SessionList sessions={data.sessions} matched={summary.total} today={today} />
      </section>

      <section className={`${styles.card} ${styles.section}`} aria-labelledby="export-h">
        <h2 id="export-h">{admin.export.heading}</h2>
        <p className={styles.hint}>{admin.export.hint}</p>
        <div className={styles.downloads}>
          <a className={styles.download} href={exportHref('sessions')}>
            {admin.export.sessions}
          </a>
          <a className={styles.download} href={exportHref('answers')}>
            {admin.export.answers}
          </a>
        </div>
      </section>

      <div className={styles.section}>
        <EventForms events={events} />
      </div>

      <div className={`${styles.grid2} ${styles.section}`} style={{ alignItems: 'start' }}>
        <BoothAccountCard username={booth.username} hasPassword={booth.hash !== null} changedAt={booth.changedAt ? thaiStamp(booth.changedAt) : ''} />
        <DangerZone />
      </div>
    </main>
  );
}
