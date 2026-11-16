/**
 * The ระบาย queue as the พี่สภา team's Discord sees it: how many chats wait for an
 * answer, how long, and which are urgent. Read by lib/vent/discord.ts to write one
 * short summary into each ping.
 *
 * A chat's wait starts at the student's first message since a พี่ last answered.
 * The last ping is remembered in the setting table, so merging holds across
 * server instances.
 *
 * Imports are relative with `.ts` so scripts can load this in plain Node.
 */

import { db } from '../db.ts';

export interface QueueStats {
  /** Chats waiting for a พี่. */
  waiting: number;
  urgent: number;
  /** Minutes the longest-waiting chat has waited. */
  oldestMin: number;
  /** Mean minutes waited, over the waiting chats. */
  avgMin: number;
}

export async function queueStats(now = Date.now()): Promise<QueueStats> {
  const c = await db();
  const r = await c.execute(`
    SELECT t.urgent,
      (SELECT MIN(m.created_at) FROM vent_message m
        WHERE m.thread_id = t.id AND m.sender = 'student'
          AND m.id > COALESCE((SELECT MAX(s.id) FROM vent_message s WHERE s.thread_id = t.id AND s.sender = 'sapa'), 0)) AS since
    FROM vent_thread t WHERE t.waiting = 1`);
  const since = r.rows.map((row) => (row.since ? Date.parse(String(row.since)) : now));
  const waits = since.map((at) => Math.max(0, (now - at) / 60_000));
  return {
    waiting: waits.length,
    urgent: r.rows.filter((row) => Number(row.urgent) === 1).length,
    oldestMin: Math.floor(Math.max(0, ...waits)),
    avgMin: waits.length ? Math.round(waits.reduce((s, w) => s + w, 0) / waits.length) : 0,
  };
}

/**
 * What the pinging remembers, in the setting table: the last ping (when, its
 * Discord message id, how many messages it stands for, the chat it points at) and
 * when everyone was last tagged.
 */
export interface Marks {
  pingAt: number;
  pingId: string;
  pingCount: number;
  pingRef: string;
  overdueAt: number;
}

const KEYS: Record<keyof Marks, string> = {
  pingAt: 'discord_ping_at',
  pingId: 'discord_ping_id',
  pingCount: 'discord_ping_n',
  pingRef: 'discord_ping_ref',
  overdueAt: 'discord_overdue_at',
};

export async function getMarks(): Promise<Marks> {
  const c = await db();
  const r = await c.execute(`SELECT key, value FROM setting WHERE key LIKE 'discord_%'`);
  const raw = (k: keyof Marks) => String(r.rows.find((row) => row.key === KEYS[k])?.value ?? '');
  const num = (k: keyof Marks) => Number(raw(k)) || 0;
  return { pingAt: num('pingAt'), pingId: raw('pingId'), pingCount: num('pingCount'), pingRef: raw('pingRef'), overdueAt: num('overdueAt') };
}

export async function setMarks(marks: Partial<Marks>): Promise<void> {
  const c = await db();
  const at = new Date().toISOString();
  await c.batch(
    Object.entries(marks).map(([k, value]) => ({
      sql: 'INSERT INTO setting (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT (key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at',
      args: [KEYS[k as keyof Marks], String(value), at],
    })),
    'write',
  );
}

/** "12 นาที", "1 ชม. 5 นาที", "ไม่ถึงนาที". */
export function waitText(min: number): string {
  if (min < 1) return 'ไม่ถึงนาที';
  if (min < 60) return `${min} นาที`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} ชม. ${m} นาที` : `${h} ชม.`;
}
