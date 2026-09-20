import fs from 'node:fs';
import path from 'node:path';

import { createClient, type Client } from '@libsql/client';

/**
 * The database, and the one place its address is decided.
 *
 * `DATABASE_URL` picks where the data lives, and nothing else in the codebase
 * knows or cares:
 *   file:./data/app.db        a single file — a school server, or this laptop
 *   libsql://name.turso.io    a hosted database — Vercel, which has no disk of
 *                             its own that survives from one request to the next
 * (with `DATABASE_AUTH_TOKEN` for the hosted one). The same code, the same
 * schema and the same queries run against both. That is the reason for libSQL
 * rather than a native SQLite driver, which cannot work on Vercel at all, and it
 * is what lets the project move to the school's own server later by changing one
 * line of configuration and copying one file.
 *
 * Imports are relative with `.ts` so scripts/test-db.mjs can load this in plain
 * Node.
 */

let client: Client | undefined;
let ready: Promise<Client> | undefined;

function resolveUrl(): string {
  const configured = process.env.DATABASE_URL;
  if (configured) return configured;
  // On Vercel there is no persistent disk, so a file: default would look like it
  // works and then quietly lose every answer. Refuse instead.
  if (process.env.VERCEL) {
    throw new Error('DATABASE_URL is not set. On Vercel it must point at a hosted libSQL database.');
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

CREATE INDEX IF NOT EXISTS idx_session_started ON session (started_at);
CREATE INDEX IF NOT EXISTS idx_session_booth ON session (mode, festival, completed_at);
`;

/**
 * The connection, with the schema in place. Safe to call on every request: the
 * first call creates the tables and seeds the defaults, and every later call
 * waits on the same promise. A failed start is forgotten so the next request
 * tries again, instead of the whole app staying broken until a restart.
 */
export function db(): Promise<Client> {
  if (!ready) {
    ready = (async () => {
      const url = resolveUrl();
      if (url.startsWith('file:') && !url.includes(':memory:')) {
        fs.mkdirSync(path.dirname(path.resolve(url.slice('file:'.length))), { recursive: true });
      }
      const c = createClient({ url, authToken: process.env.DATABASE_AUTH_TOKEN });
      await c.executeMultiple(SCHEMA);
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

/** The database file on this machine, or null for a hosted database. */
export function databaseFile(): string | null {
  const url = process.env.DATABASE_URL || (process.env.VERCEL ? '' : 'file:./data/app.db');
  return url.startsWith('file:') && !url.includes(':memory:') ? path.resolve(url.slice('file:'.length)) : null;
}

/** Test hook: close and forget the connection, so a test can reopen a fresh file. */
export function closeDb(): void {
  client?.close();
  client = undefined;
  ready = undefined;
}
