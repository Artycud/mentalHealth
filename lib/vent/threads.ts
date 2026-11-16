/**
 * ระบายให้พี่ๆ สภาฟัง: a student writes, a พี่สภา answers when they can.
 *
 * A conversation is a thread with three names, each for one reader:
 *   id    the student's secret key, kept on their phone (localStorage); it is the
 *         only thing that can read or add to the conversation as the student
 *   code  a short chat code (XXXX-XXXX), the student's second way back in from
 *         another phone; looking one up is rate-limited (lib/auth lock)
 *   ref   how the พี่สภา inbox and Discord name it, so the student's key never
 *         leaves the server
 *
 * Nothing that identifies the student is kept with it: no name, class, address,
 * device or cookie. Ending the conversation deletes all of it, and one left quiet
 * for 30 days is deleted the next time anyone starts a new one.
 *
 * Imports are relative with `.ts` so scripts can load this in plain Node.
 */

import { randomBytes, randomInt } from 'node:crypto';

import { db } from '../db.ts';
import { bump } from '../tally.ts';

export type Sender = 'student' | 'sapa';

export interface VentMessageRow {
  id: number;
  sender: Sender;
  body: string;
  at: string;
}

export interface ThreadView {
  code: string;
  /** The student wrote last: a พี่ has not answered yet. */
  waiting: boolean;
  messages: VentMessageRow[];
}

export interface InboxItem {
  ref: string;
  urgent: boolean;
  waiting: boolean;
  feel: string | null;
  updatedAt: string;
  count: number;
  last: { sender: Sender; body: string } | null;
}

/** A conversation left quiet this long is deleted. */
export const QUIET_DAYS = 30;
/** Enough for a long talk; stops one conversation filling the database. */
export const MAX_MESSAGES = 60;
export const MAX_CHARS = 1200;

const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const key = (bytes: number) => randomBytes(bytes).toString('base64url');
function newCode(): string {
  const pick = () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  const group = () => Array.from({ length: 4 }, pick).join('');
  return `${group()}-${group()}`;
}

/** What a student typed as a code, the way it is stored: upper case, one dash. */
export function normaliseCode(input: string): string {
  const raw = input.toUpperCase().replace(/[^A-Z0-9]/g, '');
  return raw.length === 8 ? `${raw.slice(0, 4)}-${raw.slice(4)}` : '';
}

const now = () => new Date().toISOString();

async function cleanup(): Promise<void> {
  const c = await db();
  const before = new Date(Date.now() - QUIET_DAYS * 86_400_000).toISOString();
  const old = await c.execute({ sql: 'SELECT id FROM vent_thread WHERE updated_at < ?', args: [before] });
  for (const row of old.rows) await deleteThread(String(row.id));
}

async function deleteThread(id: string): Promise<void> {
  const c = await db();
  // Explicit, not left to ON DELETE CASCADE: foreign keys are off by default in SQLite.
  await c.batch(
    [
      { sql: 'DELETE FROM vent_message WHERE thread_id = ?', args: [id] },
      { sql: 'DELETE FROM vent_thread WHERE id = ?', args: [id] },
    ],
    'write',
  );
}

/** Starts a conversation with its first message. Returns the student's key and code. */
export async function startThread(body: string, opts: { feel?: string; urgent: boolean }) {
  await cleanup();
  const c = await db();
  const id = key(24);
  const ref = key(9);
  const at = now();
  // A code clash is one in a trillion; try again rather than fail.
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = newCode();
    try {
      await c.batch(
        [
          {
            sql: `INSERT INTO vent_thread (id, code, ref, feel, urgent, waiting, created_at, updated_at)
                  VALUES (?, ?, ?, ?, ?, 1, ?, ?)`,
            args: [id, code, ref, opts.feel ?? null, opts.urgent ? 1 : 0, at, at],
          },
          { sql: "INSERT INTO vent_message (thread_id, sender, body, created_at) VALUES (?, 'student', ?, ?)", args: [id, body, at] },
        ],
        'write',
      );
      await bump(['vent:chats'], at);
      return { id, code, ref };
    } catch (error) {
      if (!String(error).includes('UNIQUE') || attempt === 4) throw error;
    }
  }
  throw new Error('unreachable');
}

/**
 * Adds a message. `wasWaiting` says whether the student had already written last
 * (so a new message from them needs no fresh notification).
 * Returns null when the conversation no longer exists.
 */
export async function addMessage(where: { id: string } | { ref: string }, sender: Sender, body: string, urgent = false) {
  const c = await db();
  const found = await c.execute({
    sql: `SELECT id, ref, waiting, urgent, discord_id, created_at,
                 (SELECT COUNT(*) FROM vent_message m WHERE m.thread_id = t.id) AS n,
                 (SELECT COUNT(*) FROM vent_message m WHERE m.thread_id = t.id AND m.sender = 'sapa') AS answered
          FROM vent_thread t WHERE ${'id' in where ? 'id' : 'ref'} = ?`,
    args: ['id' in where ? where.id : where.ref],
  });
  const t = found.rows[0];
  if (!t) return null;
  if (Number(t.n) >= MAX_MESSAGES) return { full: true as const };
  const at = now();
  await c.batch(
    [
      { sql: 'INSERT INTO vent_message (thread_id, sender, body, created_at) VALUES (?, ?, ?, ?)', args: [String(t.id), sender, body, at] },
      {
        sql: 'UPDATE vent_thread SET waiting = ?, urgent = MAX(urgent, ?), updated_at = ? WHERE id = ?',
        args: [sender === 'student' ? 1 : 0, urgent ? 1 : 0, at, String(t.id)],
      },
    ],
    'write',
  );
  // The first answer to a conversation, counted on the day it started (lib/tally.ts).
  if (sender === 'sapa' && Number(t.answered) === 0) {
    const started = String(t.created_at);
    const fast = Date.parse(at) - Date.parse(started) <= 3 * 60_000;
    await bump(fast ? ['vent:replied', 'vent:within3'] : ['vent:replied'], started);
  }
  return {
    full: false as const,
    ref: String(t.ref),
    wasWaiting: Number(t.waiting) === 1,
    urgent: urgent || Number(t.urgent) === 1,
    discordId: t.discord_id ? String(t.discord_id) : null,
  };
}

const toMessages = (rows: Record<string, unknown>[]): VentMessageRow[] =>
  rows.map((r) => ({ id: Number(r.id), sender: String(r.sender) as Sender, body: String(r.body), at: String(r.created_at) }));

/** The conversation as the student sees it (by their key). Null when it is gone. */
export async function readThread(id: string, afterId = 0): Promise<ThreadView | null> {
  const c = await db();
  const t = await c.execute({ sql: 'SELECT code, waiting FROM vent_thread WHERE id = ?', args: [id] });
  if (!t.rows[0]) return null;
  const m = await c.execute({
    sql: 'SELECT id, sender, body, created_at FROM vent_message WHERE thread_id = ? AND id > ? ORDER BY id',
    args: [id, afterId],
  });
  return { code: String(t.rows[0].code), waiting: Number(t.rows[0].waiting) === 1, messages: toMessages(m.rows) };
}

/** The student's key for a chat code, or null. (The caller rate-limits this.) */
export async function keyForCode(code: string): Promise<string | null> {
  const c = await db();
  const r = await c.execute({ sql: 'SELECT id FROM vent_thread WHERE code = ?', args: [code] });
  return r.rows[0] ? String(r.rows[0].id) : null;
}

/** Ends a conversation: everything in it is deleted. Returns its staff ref and Discord notice, if it existed. */
export async function endThread(id: string): Promise<{ ref: string; discordId: string | null } | null> {
  const c = await db();
  const r = await c.execute({ sql: 'SELECT ref, discord_id FROM vent_thread WHERE id = ?', args: [id] });
  if (!r.rows[0]) return null;
  await deleteThread(id);
  return { ref: String(r.rows[0].ref), discordId: r.rows[0].discord_id ? String(r.rows[0].discord_id) : null };
}

export async function setDiscordId(ref: string, discordId: string): Promise<void> {
  const c = await db();
  await c.execute({ sql: 'UPDATE vent_thread SET discord_id = ? WHERE ref = ?', args: [discordId, ref] });
}

// ---- the พี่สภา side ----

/** Every open conversation: urgent first, then those waiting for an answer, newest first. */
export async function inbox(): Promise<InboxItem[]> {
  const c = await db();
  const r = await c.execute(`
    SELECT t.ref, t.urgent, t.waiting, t.feel, t.updated_at,
           (SELECT COUNT(*) FROM vent_message m WHERE m.thread_id = t.id) AS n,
           (SELECT sender FROM vent_message m WHERE m.thread_id = t.id ORDER BY id DESC LIMIT 1) AS last_sender,
           (SELECT body FROM vent_message m WHERE m.thread_id = t.id ORDER BY id DESC LIMIT 1) AS last_body
    FROM vent_thread t
    ORDER BY t.urgent DESC, t.waiting DESC, t.updated_at DESC`);
  return r.rows.map((row) => ({
    ref: String(row.ref),
    urgent: Number(row.urgent) === 1,
    waiting: Number(row.waiting) === 1,
    feel: row.feel ? String(row.feel) : null,
    updatedAt: String(row.updated_at),
    count: Number(row.n),
    last: row.last_sender ? { sender: String(row.last_sender) as Sender, body: String(row.last_body) } : null,
  }));
}

/** One conversation for the พี่สภา team (by its staff ref). Null when it is gone. */
export async function readForStaff(ref: string) {
  const c = await db();
  const t = await c.execute({ sql: 'SELECT id, urgent, waiting, feel, updated_at FROM vent_thread WHERE ref = ?', args: [ref] });
  const row = t.rows[0];
  if (!row) return null;
  const m = await c.execute({
    sql: 'SELECT id, sender, body, created_at FROM vent_message WHERE thread_id = ? ORDER BY id',
    args: [String(row.id)],
  });
  return {
    ref,
    urgent: Number(row.urgent) === 1,
    waiting: Number(row.waiting) === 1,
    feel: row.feel ? String(row.feel) : null,
    updatedAt: String(row.updated_at),
    messages: toMessages(m.rows),
  };
}
