import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import { createClient, type Client } from '@libsql/client';

/**
 * The database, and the one place its address is decided.
 *
 * `DATABASE_URL` (or Turso's `TURSO_DATABASE_URL`) picks where the data lives,
 * and nothing else in the codebase knows or cares:
 *   file:./data/app.db        a single file — a school server, or this laptop
 *   libsql://name.turso.io    a hosted database — Vercel, which has no disk of
 *                             its own that survives from one request to the next
 * (with `DATABASE_AUTH_TOKEN` or `TURSO_AUTH_TOKEN` for the hosted one). The
 * same code, schema and queries run against both. That is the reason for libSQL
 * rather than a native SQLite driver, which cannot work on Vercel at all, and it
 * is what lets the project move to the school's own server later by changing
 * one line of configuration and copying one file.
 *
 * Imports are relative with `.ts` so scripts/test-db.mjs can load this in plain
 * Node.
 */

let client: Client | undefined;
let ready: Promise<Client> | undefined;

function resolveUrl(): string {
  const configured = process.env.DATABASE_URL || process.env.TURSO_DATABASE_URL;
  if (configured) return configured;
  // On Vercel there is no persistent disk, so a file: default would look like it
  // works and then quietly lose every answer. Refuse instead.
  if (process.env.VERCEL) {
    throw new Error('DATABASE_URL or TURSO_DATABASE_URL is not set. On Vercel it must point at a hosted libSQL database.');
  }
  return 'file:./data/app.db';
}

/**
 * The schema (BRIEF §3), plus the `event` table for the admin's Events section.
 *
 * Never stored, by design (§3, §12): names, student IDs, classes, IP addresses,
 * user-agent strings, cookies that identify a student, or free text. There is no
 * column that could hold any of them, and scripts/test-db.mjs fails if one is
 * ever added.
 */
const SCHEMA = `
CREATE TABLE IF NOT EXISTS session (
  id              TEXT PRIMARY KEY,
  mode            TEXT NOT NULL CHECK (mode IN ('checkin', 'booth')),
  festival        TEXT,
  started_at      TEXT NOT NULL,
  completed_at    TEXT,
  result_state    TEXT,
  primary_topic   TEXT,
  secondary_topic TEXT,
  booth_result    TEXT,
  device_bucket   TEXT
);

CREATE TABLE IF NOT EXISTS answer (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id  TEXT NOT NULL REFERENCES session(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL,
  choice_id   TEXT NOT NULL,
  answered_at TEXT NOT NULL,
  UNIQUE (session_id, question_id)
);

CREATE TABLE IF NOT EXISTS setting (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS event (
  festival   TEXT PRIMARY KEY,
  start_date TEXT NOT NULL,
  end_date   TEXT NOT NULL,
  time_text  TEXT NOT NULL,
  place_text TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- The login lockout (BRIEF section 11). One row per account ('admin', 'booth'), never
-- per person or address, so it identifies nobody.
CREATE TABLE IF NOT EXISTS auth_lock (
  key          TEXT PRIMARY KEY,
  failures     INTEGER NOT NULL,
  locked_until TEXT,
  updated_at   TEXT NOT NULL
);

-- VENT's global ceiling (lib/vent/cap.ts): a count per minute, nothing else.
CREATE TABLE IF NOT EXISTS vent_tick (
  minute TEXT PRIMARY KEY,
  count  INTEGER NOT NULL
);

-- ระบายให้พี่ๆ สภาฟัง (lib/vent/threads.ts): the ONE place this app keeps what a
-- student writes, because a person answers it later. The deliberate exception to
-- "no free text" (BRIEF §3, §12): no name, class, address or device is kept with
-- it, and the whole conversation is deleted when the student ends it (or after 30
-- quiet days). scripts/test-db.mjs allows exactly these two tables and no others.
--   id   the student's own secret key (kept on their phone); never shown to staff
--   code the short chat code, the student's second way back in
--   ref  how staff and Discord name the conversation (so the student's key never leaves the server)
CREATE TABLE IF NOT EXISTS vent_thread (
  id          TEXT PRIMARY KEY,
  code        TEXT NOT NULL UNIQUE,
  ref         TEXT NOT NULL UNIQUE,
  feel        TEXT,
  urgent      INTEGER NOT NULL DEFAULT 0,
  waiting     INTEGER NOT NULL DEFAULT 1,
  discord_id  TEXT,
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS vent_message (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  thread_id  TEXT NOT NULL REFERENCES vent_thread(id) ON DELETE CASCADE,
  sender     TEXT NOT NULL CHECK (sender IN ('student', 'sapa')),
  body       TEXT NOT NULL,
  created_at TEXT NOT NULL
);

-- Daily counts for the recap (lib/tally.ts): a Thailand day, what was counted
-- ("vent:chats", "topic:เรื่องเรียน") and how many. Nothing else: no session,
-- time of day, person or text, so a count can never be traced back to anyone.
CREATE TABLE IF NOT EXISTS tally (
  day   TEXT NOT NULL,
  key   TEXT NOT NULL,
  count INTEGER NOT NULL,
  PRIMARY KEY (day, key)
);

CREATE INDEX IF NOT EXISTS idx_vent_message_thread ON vent_message (thread_id, id);
CREATE INDEX IF NOT EXISTS idx_vent_thread_updated ON vent_thread (updated_at);

CREATE INDEX IF NOT EXISTS idx_session_started ON session (started_at);
CREATE INDEX IF NOT EXISTS idx_session_booth ON session (mode, festival, completed_at);
`;

/**
 * The connection, with the schema in place. Safe to call on every request: the
 * first call creates the tables and seeds the defaults, and every later call
 * waits on the same promise. A failed start is forgotten so the next request
 * tries again, instead of the whole app staying broken until a restart.
 */
/**
 * Columns added after a table first shipped, added in place to a database that
 * already has the table (CREATE TABLE IF NOT EXISTS never changes one). For ระบาย's
 * staff side: who on the team claimed a chat, who wrote each answer (their own
 * chosen nickname, never the student's), and when each side was last typing.
 */
const ADDED: [table: string, column: string][] = [
  ['vent_thread', 'claimed_by'],
  ['vent_thread', 'typing_at'],
  ['vent_thread', 'sapa_typing_at'],
  ['vent_thread', 'sapa_typing_by'],
  ['vent_message', 'staff'],
];

async function addColumns(c: Client): Promise<void> {
  for (const table of new Set(ADDED.map(([t]) => t))) {
    const have = new Set((await c.execute(`PRAGMA table_info(${table})`)).rows.map((r) => String(r.name)));
    for (const [t, column] of ADDED) {
      if (t !== table || have.has(column)) continue;
      try {
        await c.execute(`ALTER TABLE ${table} ADD COLUMN ${column} TEXT`);
      } catch (error) {
        // Another server instance added it a moment ago.
        if (!String(error).includes('duplicate column')) throw error;
      }
    }
  }
}

export function db(): Promise<Client> {
  if (!ready) {
    ready = (async () => {
      const url = resolveUrl();
      if (url.startsWith('file:') && !url.includes(':memory:')) {
        fs.mkdirSync(path.dirname(path.resolve(url.slice('file:'.length))), { recursive: true });
      }
      const authToken = process.env.DATABASE_AUTH_TOKEN || process.env.TURSO_AUTH_TOKEN;
      const c = createClient({ url, authToken });
      await c.executeMultiple(SCHEMA);
      await addColumns(c);
      // The festival that is live before anyone has touched the admin panel (§3).
      await c.execute({
        sql: "INSERT OR IGNORE INTO setting (key, value, updated_at) VALUES ('active_festival', 'loykrathong', ?)",
        args: [new Date().toISOString()],
      });
      client = c;
      return c;
    })().catch((error) => {
      ready = undefined;
      throw error;
    });
  }
  return ready;
}

/**
 * Which setting chose the database, and what kind it is: never the address or the
 * token. For /api/health, so "the data keeps disappearing" can be told apart from
 * the outside: a `file:` or `:memory:` database on Vercel is wiped by every deploy.
 */
export function databaseInfo(): {
  from: 'DATABASE_URL' | 'TURSO_DATABASE_URL' | 'default';
  kind: 'turso' | 'hosted' | 'file' | 'memory' | 'none';
  /** The database's own name (the first part of its host), which is no secret without the token. */
  name: string | null;
  /** A short fingerprint of the whole address, to see whether two deploys use the same one. */
  fingerprint: string | null;
} {
  const from = process.env.DATABASE_URL ? 'DATABASE_URL' : process.env.TURSO_DATABASE_URL ? 'TURSO_DATABASE_URL' : 'default';
  const url = (process.env.DATABASE_URL || process.env.TURSO_DATABASE_URL || (process.env.VERCEL ? '' : 'file:./data/app.db')).trim();
  const kind = !url
    ? 'none'
    : url.includes(':memory:')
      ? 'memory'
      : url.startsWith('file:')
        ? 'file'
        : /\.turso\.io/.test(url)
          ? 'turso'
          : 'hosted';
  let name: string | null = null;
  try {
    name = kind === 'turso' || kind === 'hosted' ? new URL(url.replace(/^libsql:/, 'https:')).hostname.split('.')[0] : null;
  } catch {
    name = null;
  }
  const fingerprint = url ? createHash('sha256').update(url).digest('hex').slice(0, 10) : null;
  return { from, kind, name, fingerprint };
}

/** The database file on this machine, or null for a hosted database. */
export function databaseFile(): string | null {
  const url = process.env.DATABASE_URL || process.env.TURSO_DATABASE_URL || (process.env.VERCEL ? '' : 'file:./data/app.db');
  return url.startsWith('file:') && !url.includes(':memory:') ? path.resolve(url.slice('file:'.length)) : null;
}

/** Test hook: close and forget the connection, so a test can reopen a fresh file. */
export function closeDb(): void {
  client?.close();
  client = undefined;
  ready = undefined;
}
