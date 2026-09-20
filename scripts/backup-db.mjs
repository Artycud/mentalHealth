// A safe backup of the database, made while the site is running. Run:  npm run db:backup
//
// Copying data/app.db with a file manager can catch it halfway through a write and
// leave a broken copy. This asks the database itself for a consistent snapshot
// (SQLite's VACUUM INTO), so it is safe at any moment, even during a booth session.
//
// Snapshots go in a `backups` folder next to the database, named by date and time.
// The newest KEEP are kept; older ones are removed so the disk never fills.
//
// Only for a database file on this machine. A hosted database (libsql://...) is
// backed up by its provider.
import fs from 'node:fs';
import path from 'node:path';

import { createClient } from '@libsql/client';

const KEEP = Number(process.env.BACKUP_KEEP ?? 60);
const url = process.env.DATABASE_URL || 'file:./data/app.db';

if (!url.startsWith('file:')) {
  console.error('DATABASE_URL is a hosted database. Back it up with your database provider, not with this script.');
  process.exit(1);
}

const dbFile = path.resolve(url.slice('file:'.length));
if (!fs.existsSync(dbFile)) {
  console.error(`No database at ${dbFile} yet, so there is nothing to back up.`);
  process.exit(1);
}

const dir = path.join(path.dirname(dbFile), 'backups');
fs.mkdirSync(dir, { recursive: true });

// Local time, sortable: 2026-11-19-1130
const now = new Date();
const pad = (n) => String(n).padStart(2, '0');
const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;
const target = path.join(dir, `app-${stamp}.db`);
if (fs.existsSync(target)) {
  console.error(`${target} already exists (a backup was made this minute). Nothing to do.`);
  process.exit(0);
}

const db = createClient({ url });
try {
  // The path is ours, never user input, but quote it properly anyway.
  await db.execute(`VACUUM INTO '${target.replace(/'/g, "''")}'`);
} finally {
  db.close();
}

// Prove the copy is a real, readable database before trusting it.
const check = createClient({ url: `file:${target}` });
let sessions;
try {
  sessions = Number((await check.execute('SELECT COUNT(*) AS n FROM session')).rows[0].n);
} finally {
  check.close();
}

const old = fs
  .readdirSync(dir)
  .filter((f) => /^app-.*\.db$/.test(f))
  .sort()
  .reverse()
  .slice(KEEP);
for (const f of old) fs.rmSync(path.join(dir, f));

console.log(`Backed up ${sessions} sessions to ${target} (${(fs.statSync(target).size / 1024).toFixed(0)} KB).`);
if (old.length) console.log(`Removed ${old.length} older backup(s); keeping the newest ${KEEP}.`);
