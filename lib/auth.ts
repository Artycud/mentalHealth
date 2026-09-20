import { createHash, createHmac, randomBytes, randomInt, scrypt, timingSafeEqual } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import { databaseFile, db } from './db.ts';

/**
 * Passwords, signed cookies and the login lockout (BRIEF §11). Nothing here knows
 * about Next.js, so scripts/test-auth.mjs can run it in plain Node; the parts that
 * touch cookies and redirects are in lib/guard.ts.
 *
 * Two accounts use it, and neither is a student: the ADMIN (the student council, one
 * account set in the environment) and the BOOTH (the kiosk and TV devices, one account
 * the admin sets from the panel, stored in the `setting` table). Students have no
 * login and nothing here can identify one (§12).
 *
 * Relative imports with `.ts`, like the rest of lib/, so the tests can load it.
 */

// ---- passwords ----

const N = 16384; // scrypt cost; ~16 MB of memory and a few tens of milliseconds
const R = 8;
const P = 1;
const KEYLEN = 64;

const b64 = (buf: Buffer) => buf.toString('base64url');
const unb64 = (s: string) => Buffer.from(s, 'base64url');

const derive = (password: string, salt: Buffer, n: number, r: number, p: number, len: number) =>
  new Promise<Buffer>((resolve, reject) => {
    scrypt(password.normalize('NFKC'), salt, len, { N: n, r, p }, (error, key) => (error ? reject(error) : resolve(key)));
  });

/**
 * A password hash you can store. scrypt is built into Node, so nothing native has to
 * compile on the school's server. The format, `scrypt.N.r.p.salt.hash`, is base64url
 * separated by dots and contains no `$`, because a `$` in .env.local is read as a
 * variable and would silently corrupt the value.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await derive(password, salt, N, R, P, KEYLEN);
  return ['scrypt', N, R, P, b64(salt), b64(key)].join('.');
}

/** True only for the right password. A malformed hash is simply "no", never a throw. */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, n, r, p, salt, hash] = stored.split('.');
  if (scheme !== 'scrypt' || !salt || !hash) return false;
  const [nn, rr, pp] = [Number(n), Number(r), Number(p)];
  if (![nn, rr, pp].every((x) => Number.isInteger(x) && x > 0) || nn > 2 ** 20) return false;
  try {
    const expected = unb64(hash);
    const actual = await derive(password, unb64(salt), nn, rr, pp, expected.length);
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}

/** Equal strings, in time that does not depend on where they differ. */
export function safeEqual(a: string, b: string): boolean {
  const ha = createHash('sha256').update(a).digest();
  const hb = createHash('sha256').update(b).digest();
  return timingSafeEqual(ha, hb);
}

/** A random secret for signing cookies. */
export const newSecret = () => b64(randomBytes(48));

/**
 * A password for the booth devices, made to be typed on an iPad: lower case only, no
 * 0/o, 1/l/i lookalikes, and grouped, like "kmnp-7xqz". About 40 bits, which is plenty
 * behind a lockout for something that only decides who may open the kiosk.
 */
const EASY = 'abcdefghjkmnpqrstuvwxyz23456789';
export function generateBoothPassword(): string {
  const pick = () => EASY[randomInt(EASY.length)];
  const group = () => Array.from({ length: 4 }, pick).join('');
  return `${group()}-${group()}`;
}

// ---- signed cookies ----

export type Role = 'admin' | 'booth';

export interface TokenPayload {
  role: Role;
  /** Expiry, in milliseconds since the epoch. */
  exp: number;
  /**
   * Which version of the password this was issued under. When the password changes,
   * every cookie issued before it stops working, so "reset the booth password" also
   * signs out every booth device.
   */
  v: string;
}

/** A short fingerprint of a password hash, for `TokenPayload.v`. Not reversible. */
export const passwordVersion = (hash: string) => createHash('sha256').update(hash).digest('base64url').slice(0, 12);

const sign = (body: string, secret: string) => createHmac('sha256', secret).update(body).digest();

export function signToken(payload: TokenPayload, secret: string): string {
  const body = b64(Buffer.from(JSON.stringify(payload)));
  return `${body}.${b64(sign(body, secret))}`;
}

/** The payload, or null if the token is forged, tampered with, expired or malformed. */
export function verifyToken(token: string | undefined, secret: string, now = Date.now()): TokenPayload | null {
  if (!token || !secret) return null;
  const [body, signature] = token.split('.');
  if (!body || !signature) return null;
  const expected = sign(body, secret);
  const given = unb64(signature);
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  try {
    const payload = JSON.parse(unb64(body).toString('utf8')) as TokenPayload;
    if ((payload.role !== 'admin' && payload.role !== 'booth') || typeof payload.v !== 'string') return null;
    if (typeof payload.exp !== 'number' || payload.exp <= now) return null;
    return payload;
  } catch {
    return null;
  }
}

/** How long a login lasts (BRIEF §11): the admin for a working day, the booth for a booth day. */
export const SESSION_MS: Record<Role, number> = { admin: 8 * 3_600_000, booth: 12 * 3_600_000 };

// ---- the lockout ----

/** Five wrong passwords lock that account for ten minutes (BRIEF §11). */
export const MAX_FAILURES = 5;
export const LOCK_MS = 10 * 60_000;

export type LockKey = 'admin' | 'booth' | 'setup';

/**
 * Kept in the database, not in memory: memory is not shared between server instances
 * or kept across restarts, so an in-memory count would let an attacker simply retry.
 * Keyed to the account, never to a person or an address, so nothing identifying is
 * stored (§12). The price is that anyone can lock the account for ten minutes by
 * guessing; with one account and one council, that is the right trade.
 */
export async function lockRemainingMs(key: LockKey, now = Date.now()): Promise<number> {
  const c = await db();
  const r = await c.execute({ sql: 'SELECT locked_until FROM auth_lock WHERE key = ?', args: [key] });
  const until = r.rows[0]?.locked_until;
  if (!until) return 0;
  return Math.max(0, Date.parse(String(until)) - now);
}

export async function recordFailure(key: LockKey, now = Date.now()): Promise<{ locked: boolean }> {
  const c = await db();
  const r = await c.execute({ sql: 'SELECT failures, locked_until FROM auth_lock WHERE key = ?', args: [key] });
  const row = r.rows[0];
  // A lock that has run out starts the count again from zero.
  const expired = row?.locked_until && Date.parse(String(row.locked_until)) <= now;
  const failures = (expired || !row ? 0 : Number(row.failures)) + 1;
  const lockedUntil = failures >= MAX_FAILURES ? new Date(now + LOCK_MS).toISOString() : null;
  await c.execute({
    sql: `INSERT INTO auth_lock (key, failures, locked_until, updated_at) VALUES (?, ?, ?, ?)
          ON CONFLICT(key) DO UPDATE SET failures = excluded.failures,
            locked_until = excluded.locked_until, updated_at = excluded.updated_at`,
    args: [key, failures >= MAX_FAILURES ? 0 : failures, lockedUntil, new Date(now).toISOString()],
  });
  return { locked: lockedUntil !== null };
}

export async function recordSuccess(key: LockKey): Promise<void> {
  const c = await db();
  await c.execute({ sql: 'DELETE FROM auth_lock WHERE key = ?', args: [key] });
}

// ---- the booth account, in the setting table ----

export const BOOTH_DEFAULT_USERNAME = 'booth';

async function writeSetting(key: string, value: string): Promise<void> {
  const c = await db();
  await c.execute({
    sql: `INSERT INTO setting (key, value, updated_at) VALUES (?, ?, ?)
          ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    args: [key, value, new Date().toISOString()],
  });
}

export interface BoothAccount {
  username: string;
  /** Null until the admin has generated a password: the booth pages are open until then. */
  hash: string | null;
  /** When the password was last generated. */
  changedAt: string | null;
}

export async function getBoothAccount(): Promise<BoothAccount> {
  const c = await db();
  const r = await c.execute({
    sql: "SELECT key, value, updated_at FROM setting WHERE key IN ('booth_username', 'booth_password_hash')",
    args: [],
  });
  const byKey = new Map(r.rows.map((row) => [String(row.key), row]));
  return {
    username: String(byKey.get('booth_username')?.value ?? BOOTH_DEFAULT_USERNAME),
    hash: byKey.get('booth_password_hash') ? String(byKey.get('booth_password_hash')?.value) : null,
    changedAt: byKey.get('booth_password_hash') ? String(byKey.get('booth_password_hash')?.updated_at) : null,
  };
}

/** Usernames are short and plain, so a typo on an iPad is easy to see. */
export const validBoothUsername = (s: string) => /^[a-z0-9._-]{3,24}$/.test(s);

export async function setBoothUsername(username: string): Promise<void> {
  if (!validBoothUsername(username)) throw new Error('bad booth username');
  await writeSetting('booth_username', username);
}

/**
 * Makes a new booth password, stores ONLY its hash, and returns the password itself
 * to the caller once. Nobody can read it back afterwards, not even an admin: a
 * forgotten password is reset, not recovered (§11, §12).
 */
export async function regenerateBoothPassword(): Promise<string> {
  const password = generateBoothPassword();
  await writeSetting('booth_password_hash', await hashPassword(password));
  return password;
}

// ---- checking a login ----

export type LoginResult = 'ok' | 'wrong' | 'locked';

/** A fixed hash to check against when the username is wrong, so it takes as long as a right one. */
let decoy: Promise<string> | undefined;
const decoyHash = () => (decoy ??= hashPassword(b64(randomBytes(9))));

/**
 * The whole rule for one login attempt: refuse while locked, count a failure, clear
 * the count on success. The username and the password are both checked every time,
 * so a wrong username cannot be told from a wrong password by how long it takes.
 */
export async function attemptLogin(
  key: LockKey,
  given: { username: string; password: string },
  account: { username: string; hash: string },
  now = Date.now(),
): Promise<LoginResult> {
  if ((await lockRemainingMs(key, now)) > 0) return 'locked';
  const nameOk = safeEqual(given.username.trim(), account.username);
  const passwordOk = await verifyPassword(given.password, nameOk ? account.hash : await decoyHash());
  if (nameOk && passwordOk) {
    await recordSuccess(key);
    return 'ok';
  }
  const { locked } = await recordFailure(key, now);
  return locked ? 'locked' : 'wrong';
}

// ---- the admin account and the signing secret, in the database ----
//
// The admin does not have to be set up with a terminal command. The first time /admin
// is opened with no account, it asks for a username and a password (see
// app/admin/setup), and this is where they are kept: as a hash, never the password.
// The environment can still set the account (ADMIN_USERNAME, ADMIN_PASSWORD_HASH,
// SESSION_SECRET) for a server that prefers it, and wins over what is stored.

const ACCOUNT_KEY = 'admin_account';
const SECRET_KEY = 'session_secret';
const CODE_KEY = 'admin_setup_code';

export interface StoredAdmin {
  username: string;
  hash: string;
}

/** Plain usernames, easy to type and to see a typo in. */
export const validAdminUsername = (s: string) => /^[a-zA-Z0-9._-]{3,32}$/.test(s);

/** Length counts characters, not bytes, so a Thai passphrase is counted fairly. */
export const MIN_PASSWORD = 10;

/** Why a password is refused, or null if it is fine. */
export function passwordProblem(password: string, username: string): 'too_short' | 'has_username' | null {
  if ([...password].length < MIN_PASSWORD) return 'too_short';
  if (username && password.toLowerCase().includes(username.toLowerCase())) return 'has_username';
  return null;
}

export async function getStoredAdmin(): Promise<StoredAdmin | null> {
  const c = await db();
  const r = await c.execute({ sql: 'SELECT value FROM setting WHERE key = ?', args: [ACCOUNT_KEY] });
  if (!r.rows[0]) return null;
  try {
    const v = JSON.parse(String(r.rows[0].value)) as Partial<StoredAdmin>;
    return typeof v.username === 'string' && typeof v.hash === 'string' ? { username: v.username, hash: v.hash } : null;
  } catch {
    return null;
  }
}

/**
 * Makes the admin account, but only if there is not one already. One statement decides
 * it (INSERT OR IGNORE), so two people submitting the setup form at the same moment
 * cannot both win: exactly one gets true.
 */
export async function createAdminAccount(username: string, password: string): Promise<boolean> {
  const hash = await hashPassword(password);
  const c = await db();
  const r = await c.execute({
    sql: 'INSERT OR IGNORE INTO setting (key, value, updated_at) VALUES (?, ?, ?)',
    args: [ACCOUNT_KEY, JSON.stringify({ username, hash }), new Date().toISOString()],
  });
  return r.rowsAffected === 1;
}

/** A new password for the stored account. Returns its hash, so the caller can sign in with it. */
export async function changeAdminPassword(newPassword: string): Promise<string> {
  const current = await getStoredAdmin();
  if (!current) throw new Error('there is no stored admin account');
  const hash = await hashPassword(newPassword);
  const c = await db();
  await c.execute({
    sql: 'UPDATE setting SET value = ?, updated_at = ? WHERE key = ?',
    args: [JSON.stringify({ username: current.username, hash }), new Date().toISOString(), ACCOUNT_KEY],
  });
  return hash;
}

/** For "I forgot the password" (npm run admin:reset): the setup page comes back. */
export async function resetAdminAccount(): Promise<void> {
  const c = await db();
  await c.execute({ sql: 'DELETE FROM setting WHERE key IN (?, ?)', args: [ACCOUNT_KEY, CODE_KEY] });
  await c.execute({ sql: 'DELETE FROM auth_lock', args: [] });
  const f = codeFile();
  if (f) fs.rmSync(f, { force: true });
}

/**
 * The secret that signs the login cookies. From SESSION_SECRET if the environment sets a
 * good one (32+ characters); otherwise made once and kept in the database, so a fresh
 * install needs no configuration at all.
 */
let storedSecret: Promise<string> | undefined;
export async function getSessionSecret(env: NodeJS.ProcessEnv = process.env): Promise<string> {
  const fromEnv = env.SESSION_SECRET?.trim();
  if (fromEnv && fromEnv.length >= 32) return fromEnv;
  storedSecret ??= (async () => {
    const c = await db();
    await c.execute({
      sql: 'INSERT OR IGNORE INTO setting (key, value, updated_at) VALUES (?, ?, ?)',
      args: [SECRET_KEY, newSecret(), new Date().toISOString()],
    });
    return String((await c.execute({ sql: 'SELECT value FROM setting WHERE key = ?', args: [SECRET_KEY] })).rows[0].value);
  })().catch((error) => {
    storedSecret = undefined;
    throw error;
  });
  return storedSecret;
}

/** Forget the cached secret. For tests that reopen a fresh database. */
export const forgetSessionSecret = () => {
  storedSecret = undefined;
};

// ---- the setup code ----

/** Named after its database (data/admin-setup-code-app.txt), so two databases never share one. */
const codeFile = () => {
  const dbFile = databaseFile();
  return dbFile ? path.join(path.dirname(dbFile), `admin-setup-code-${path.basename(dbFile, path.extname(dbFile))}.txt`) : null;
};

/**
 * The code a person must type to set up the admin on a live server. Without it, whoever
 * reached /admin first after a deployment could claim the account. It is made the first
 * time it is needed, printed in the server's log, and written to data/admin-setup-code-app.txt,
 * so it is only ever shown to someone with access to the machine. Kept until setup is done.
 */
export async function getSetupCode(): Promise<string> {
  const c = await db();
  const existing = await c.execute({ sql: 'SELECT value FROM setting WHERE key = ?', args: [CODE_KEY] });
  if (existing.rows[0]) return String(existing.rows[0].value);
  await c.execute({
    sql: 'INSERT OR IGNORE INTO setting (key, value, updated_at) VALUES (?, ?, ?)',
    args: [CODE_KEY, generateBoothPassword(), new Date().toISOString()],
  });
  const code = String((await c.execute({ sql: 'SELECT value FROM setting WHERE key = ?', args: [CODE_KEY] })).rows[0].value);
  const file = codeFile();
  console.log(`[admin setup] The admin has not been set up yet. Setup code: ${code}${file ? `  (also in ${file})` : ''}`);
  if (file) {
    try {
      fs.writeFileSync(file, `${code}\n`, { mode: 0o600 });
    } catch {
      /* the log line above is enough */
    }
  }
  return code;
}

export async function clearSetupCode(): Promise<void> {
  const c = await db();
  await c.execute({ sql: 'DELETE FROM setting WHERE key = ?', args: [CODE_KEY] });
  const file = codeFile();
  if (file) fs.rmSync(file, { force: true });
}
