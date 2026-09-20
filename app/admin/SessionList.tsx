'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import { admin } from '@/content/th/admin';
import type { AdminSession } from '@/lib/admin-data';

import styles from './admin.module.css';
import { formatDuration, fullDay } from './format';
import { send } from './send';

/**
 * The sessions, grouped and collapsible (BRIEF §11).
 *
 * Grouped by day by default (newest first; today open, older days closed), and by
 * mode, result or festival on request. A day that holds both modes is split by mode
 * inside. Each group header and each row is a real button with aria-expanded and
 * aria-controls, so Enter and Space work. An unfinished session stays in the list,
 * marked ยังไม่จบ, because drop-off is worth knowing.
 */

type By = 'day' | 'mode' | 'state' | 'festival';
const BYS: By[] = ['day', 'mode', 'state', 'festival'];

interface Group {
  key: string;
  title: string;
  sessions: AdminSession[];
}

function groupKey(s: AdminSession, by: By): { key: string; title: string } {
  switch (by) {
    case 'day':
      return { key: s.day, title: fullDay(s.day) };
    case 'mode':
      return { key: s.mode, title: admin.modes[s.mode] };
    case 'festival':
      return { key: s.festival ?? '-', title: s.festivalName || '-' };
    case 'state':
      if (s.mode === 'booth') return { key: s.completedAt ? 'booth' : 'open', title: s.completedAt ? admin.modes.booth : admin.sessions.unfinished };
      return s.state ? { key: s.state, title: admin.states[s.state] } : { key: 'open', title: admin.sessions.unfinished };
  }
}

const STATE_ORDER = ['ok', 'thinking', 'drained', 'heavy', 'booth', 'open'];

function buildGroups(sessions: AdminSession[], by: By): Group[] {
  const map = new Map<string, Group>();
  for (const s of sessions) {
    const { key, title } = groupKey(s, by);
    const g = map.get(key) ?? { key, title, sessions: [] };
    g.sessions.push(s);
    map.set(key, g);
  }
  const groups = [...map.values()];
  if (by === 'state') groups.sort((a, b) => STATE_ORDER.indexOf(a.key) - STATE_ORDER.indexOf(b.key));
  if (by === 'mode') groups.sort((a, b) => a.key.localeCompare(b.key));
  return groups; // days and festivals keep the newest-first order they arrived in
}

/** "โอเค 2 · บูธ 3 · ยังไม่จบ 1": what is in a group, in one line. */
function breakdown(sessions: AdminSession[]): string {
  const counts = new Map<string, number>();
  const bump = (label: string) => counts.set(label, (counts.get(label) ?? 0) + 1);
  for (const s of sessions) {
    if (!s.completedAt) bump(admin.sessions.unfinished);
    else if (s.mode === 'booth') bump(admin.modes.booth);
    else if (s.state) bump(admin.states[s.state]);
  }
  return [...counts.entries()].map(([label, n]) => `${label} ${n}`).join(' · ');
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg className={`${styles.chev} ${open ? styles.chevOpen : ''}`} width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
      <path d="M5 2.5 L10 7 L5 11.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Row({ s, open, onToggle }: { s: AdminSession; open: boolean; onToggle: () => void }) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const panelId = `sess-${s.id}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(s.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked: the id is shown in full, so it can be selected by hand */
    }
  }

  async function remove() {
    if (!window.confirm(admin.sessions.confirmDelete)) return;
    const r = await send(`/api/admin/sessions/${s.id}`, 'DELETE');
    if (r.ok) router.refresh();
    else window.alert(admin.errors.generic);
  }

  return (
    <div className={styles.sess} data-session={s.id}>
      <h4 style={{ margin: 0, font: 'inherit' }}>
        <button type="button" className={styles.sessRow} aria-expanded={open} aria-controls={panelId} onClick={onToggle}>
          <Chevron open={open} />
          <span className={styles.mono}>{s.clock}</span>
          <span>
            <span className={styles.chip}>{admin.modes[s.mode]}</span>
          </span>
          <span className={styles.sessCells}>
            {!s.completedAt ? (
              <span className={`${styles.chip} ${styles.chipOpen}`}>{admin.sessions.unfinished}</span>
            ) : s.mode === 'booth' ? (
              <span>{s.flower}</span>
            ) : (
              <>
                <span>{s.state ? admin.states[s.state] : ''}</span>
                <span style={{ color: 'var(--ink-soft)' }}>{[s.primary, s.secondary].filter(Boolean).join(' · ')}</span>
              </>
            )}
          </span>
          <span className={styles.sessEnd}>{s.durationSeconds !== null ? formatDuration(s.durationSeconds) : ''}</span>
        </button>
      </h4>
      <div id={panelId} className={`${styles.panel} ${open ? styles.panelOpen : ''}`} role="region" aria-label={s.id}>
        <div className={styles.panelInner}>
          <div className={styles.detail}>
            {s.answers.length === 0 ? (
              <p className={styles.hint}>{admin.sessions.noAnswers}</p>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>{admin.sessions.question}</th>
                    <th>{admin.sessions.answer}</th>
                  </tr>
                </thead>
                <tbody>
                  {s.answers.map((a) => (
                    <tr key={a.questionId}>
                      <td>{a.question}</td>
                      <td>{a.choice}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <div className={styles.detailTools}>
              <span>
                {admin.sessions.id} <span className={styles.mono}>{s.id}</span>
              </span>
              <button type="button" className={`${styles.button} ${styles.buttonQuiet} ${styles.small}`} onClick={copy}>
                {copied ? admin.sessions.copied : admin.sessions.copy}
              </button>
              {s.device && (
                <span>
                  {admin.sessions.device} {s.device}
                </span>
              )}
              <button type="button" className={`${styles.button} ${styles.buttonDanger} ${styles.small}`} onClick={remove}>
                {admin.sessions.delete}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SessionList({ sessions, matched, today }: { sessions: AdminSession[]; matched: number; today: string }) {
  const [by, setBy] = useState<By>('day');
  // Groups and rows the person has opened or closed; anything not here uses its default.
  const [groupOpen, setGroupOpen] = useState<Record<string, boolean>>({});
  const [rowOpen, setRowOpen] = useState<Record<string, boolean>>({});

  const groups = useMemo(() => buildGroups(sessions, by), [sessions, by]);
  const groupId = (g: Group) => `${by}:${g.key}`;
  const isGroupOpen = (g: Group, index: number) => groupOpen[groupId(g)] ?? (by === 'day' ? g.key === today : index === 0);

  if (sessions.length === 0) return <p className={styles.empty}>{admin.sessions.none}</p>;

  return (
    <div>
      <div className={styles.listTools}>
        <span className={styles.hint} style={{ margin: 0 }}>
          {admin.sessions.groupBy}
        </span>
        <div className={styles.seg} role="group" aria-label={admin.sessions.groupBy}>
          {BYS.map((b) => (
            <button key={b} type="button" aria-pressed={by === b} className={`${styles.segBtn} ${by === b ? styles.segOn : ''}`} onClick={() => setBy(b)}>
              {admin.sessions.groups[b]}
            </button>
          ))}
        </div>
        <button
          type="button"
          className={styles.linkButton}
          onClick={() => setGroupOpen(Object.fromEntries(groups.map((g) => [groupId(g), true])))}
        >
          {admin.sessions.expandAll}
        </button>
        <button
          type="button"
          className={styles.linkButton}
          onClick={() => {
            setGroupOpen(Object.fromEntries(groups.map((g) => [groupId(g), false])));
            setRowOpen({});
          }}
        >
          {admin.sessions.collapseAll}
        </button>
      </div>

      {groups.map((g, i) => {
        const open = isGroupOpen(g, i);
        const panelId = `grp-${by}-${i}`;
        // A day that holds both modes is split by mode inside.
        const splitByMode = by === 'day' && new Set(g.sessions.map((s) => s.mode)).size > 1;
        const parts = splitByMode
          ? (['checkin', 'booth'] as const).map((m) => ({ label: admin.modes[m], list: g.sessions.filter((s) => s.mode === m) })).filter((p) => p.list.length)
          : [{ label: '', list: g.sessions }];
        return (
          <section key={groupId(g)} className={styles.group}>
            <h3 style={{ margin: 0, font: 'inherit' }}>
              <button
                type="button"
                className={styles.groupHead}
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => setGroupOpen((m) => ({ ...m, [groupId(g)]: !open }))}
              >
                <Chevron open={open} />
                <span className={styles.groupTitle}>{g.title}</span>
                <span className={styles.groupMeta}>
                  {g.sessions.length} · {breakdown(g.sessions)}
                </span>
              </button>
            </h3>
            <div id={panelId} className={`${styles.panel} ${open ? styles.panelOpen : ''}`}>
              <div className={styles.panelInner}>
                {parts.map((p) => (
                  <div key={p.label || 'all'}>
                    {p.label && <p className={styles.subHead}>{p.label}</p>}
                    {p.list.map((s) => (
                      <Row key={s.id} s={s} open={!!rowOpen[s.id]} onToggle={() => setRowOpen((m) => ({ ...m, [s.id]: !m[s.id] }))} />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </section>
        );
      })}

      {matched > sessions.length && <p className={styles.hint} style={{ marginTop: 8 }}>{admin.sessions.shownOf(sessions.length, matched)}</p>}
    </div>
  );
}
