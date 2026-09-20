import { admin } from '@/content/th/admin';
import type { AdminData, QuestionStat } from '@/lib/admin-data';

import styles from './admin.module.css';
import { shortDay } from './format';

/**
 * The charts (BRIEF §11): plain CSS bars built from divs, no chart library. Every bar
 * is also written out as a number, so nothing depends on seeing a colour.
 */

function BarList({
  items,
  tone = 'blue',
}: {
  items: { key: string; label: string; count: number; pct?: number }[];
  tone?: 'blue' | 'pink' | 'sun';
}) {
  const max = Math.max(...items.map((i) => i.count), 1);
  const fill = tone === 'pink' ? styles.barPink : tone === 'sun' ? styles.barSun : '';
  return (
    <ul className={styles.bars}>
      {items.map((i) => (
        <li key={i.key} className={styles.bar}>
          <span className={styles.barLabel} title={i.label}>
            {i.label}
          </span>
          <span className={styles.barTrack} aria-hidden="true">
            <span className={`${styles.barFill} ${fill}`} style={{ display: 'block', width: `${(i.count / max) * 100}%` }} />
          </span>
          <span className={styles.barNum}>
            {i.count}
            {i.pct !== undefined ? ` · ${i.pct}%` : ''}
          </span>
        </li>
      ))}
    </ul>
  );
}

function Questions({ stats }: { stats: QuestionStat[] }) {
  return (
    <div className={styles.questions}>
      {stats.map((q, i) => (
        <div key={q.id} className={styles.qCard}>
          <h4 className={styles.qHead}>
            {i + 1}. {q.headline} <span className={styles.qMeta}>· {admin.charts.answered(q.answered)}</span>
          </h4>
          <BarList items={q.choices.map((c) => ({ key: c.id, label: c.label, count: c.count, pct: c.pct }))} tone="pink" />
        </div>
      ))}
    </div>
  );
}

export function Charts({ data }: { data: AdminData }) {
  const maxDay = Math.max(...data.perDay.map((d) => d.total), 1);
  const finishedStates = data.states.reduce((s, x) => s + x.count, 0);
  const finishedFlowers = data.flowers.reduce((s, x) => s + x.count, 0);

  return (
    <>
      <div className={`${styles.grid2} ${styles.section}`} style={{ alignItems: 'start' }}>
        <section className={styles.card} aria-labelledby="perday-h">
          <h3 className={styles.chartTitle} id="perday-h">
            {admin.charts.perDay}
            <span className={styles.qMeta}>
              {' '}
              · {admin.charts.started} / {admin.charts.done}
            </span>
          </h3>
          {data.perDay.length === 0 ? (
            <p className={styles.empty}>{admin.charts.empty}</p>
          ) : (
            <div className={styles.days} role="list">
              {data.perDay.map((d) => (
                <div key={d.day} className={styles.day} role="listitem" title={`${d.total} / ${d.completed}`}>
                  <span className={styles.dayCount}>{d.total}</span>
                  <div className={styles.dayBar} style={{ height: `${(d.total / maxDay) * 78}%` }}>
                    <span className={styles.dayFill} style={{ height: `${d.total ? (d.completed / d.total) * 100 : 0}%` }} />
                  </div>
                  <span>{shortDay(d.day)}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <div style={{ display: 'grid', gap: 12 }}>
          <section className={styles.card} aria-labelledby="states-h">
            <h3 className={styles.chartTitle} id="states-h">
              {admin.charts.states}
            </h3>
            {finishedStates === 0 ? (
              <p className={styles.empty}>{admin.charts.empty}</p>
            ) : (
              <BarList
                items={data.states.map((s) => ({
                  key: s.state,
                  label: admin.states[s.state],
                  count: s.count,
                  pct: Math.round((s.count / finishedStates) * 100),
                }))}
              />
            )}
          </section>
          <section className={styles.card} aria-labelledby="flowers-h">
            <h3 className={styles.chartTitle} id="flowers-h">
              {admin.charts.flowers}
            </h3>
            {finishedFlowers === 0 ? (
              <p className={styles.empty}>{admin.charts.empty}</p>
            ) : (
              <BarList
                tone="sun"
                items={data.flowers.map((f) => ({
                  key: f.id,
                  label: f.name,
                  count: f.count,
                  pct: Math.round((f.count / finishedFlowers) * 100),
                }))}
              />
            )}
          </section>
        </div>
      </div>

      <div className={styles.section}>
        <h3 className={styles.h2}>
          {admin.charts.answers} · {admin.charts.checkin}
        </h3>
        <Questions stats={data.checkinQuestions} />
      </div>
      <div className={styles.section}>
        <h3 className={styles.h2}>
          {admin.charts.answers} · {admin.charts.booth}
        </h3>
        <Questions stats={data.boothQuestions} />
      </div>
    </>
  );
}
