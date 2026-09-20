import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import {
  getBoothAccount, getSessionSecret, getStoredAdmin, passwordVersion, SESSION_MS, signToken, verifyToken, type Role,
} from './auth.ts';
import { ApiError } from './session.ts';

/**
 * Who is allowed in, for pages and API routes (BRIEF §11, §12).
 *
 * Two accounts, both for staff. The ADMIN account reaches the whole panel; it is made
 * in the browser the first time /admin is opened (app/admin/setup) and stored in the
 * database, or set from the environment by a server that prefers that. The BOOTH
 * account is set from the panel and reaches only the kiosk and the TV; a booth device
 * can never open /admin or any /api/admin/* route. Students have no account and
 * nothing here touches them.
 *
 * Every check happens on the server, on every request. A page that hides a button is
 * not security; the API refuses on its own.
 */

export const ADMIN_COOKIE = 'cud_admin';
export const BOOTH_COOKIE = 'cud_booth';

export interface AdminConfig {
  username: string;
  hash: string;
  /** Where the account comes from: the server's environment (which wins) or the database. */
  source: 'env' | 'stored';
}

/**
 * The admin account, or null if nobody has set one up yet. Null means the panel is
 * closed and shows the one-time setup page: there is no default password.
 */
export async function adminConfig(env: NodeJS.ProcessEnv = process.env): Promise<AdminConfig | null> {
  const username = env.ADMIN_USERNAME?.trim();
  const hash = env.ADMIN_PASSWORD_HASH?.trim();
  if (username && hash) return { username, hash, source: 'env' };
  const stored = await getStoredAdmin();
  return stored ? { ...stored, source: 'stored' } : null;
}

/**
 * Whether the setup form must ask for the setup code. On a live server (production) it
 * must, so the first stranger to reach /admin cannot claim the account; the code is
 * printed in the server's log and written to a file only someone with access to the
 * machine can read. While developing, on your own computer, it does not ask.
 */
export const setupNeedsCode = (): boolean => process.env.NODE_ENV === 'production';

// ---- reading who someone is ----

export async function isAdmin(): Promise<boolean> {
  const config = await adminConfig();
  if (!config) return false;
  const payload = verifyToken((await cookies()).get(ADMIN_COOKIE)?.value, await getSessionSecret());
  return payload?.role === 'admin' && payload.v === passwordVersion(config.hash);
}

/** Booth devices: the booth cookie, or an admin (staff testing the kiosk). */
export async function isBooth(): Promise<boolean> {
  if (await isAdmin()) return true;
  const account = await getBoothAccount();
  if (!account.hash) return false;
  const payload = verifyToken((await cookies()).get(BOOTH_COOKIE)?.value, await getSessionSecret());
  return payload?.role === 'booth' && payload.v === passwordVersion(account.hash);
}

// ---- pages ----

/** For an admin page. Anyone else goes to the login page (which sends a first visit to setup). */
export async function requireAdminPage(): Promise<void> {
  if (!(await isAdmin())) redirect('/admin/login');
}

/**
 * For the kiosk and the TV. Until the admin has generated a booth password the
 * screens are open, so a fresh install works at once; from then on they need the
 * booth login. (The admin panel warns while they are open.)
 */
export async function requireBooth(next: '/booth/kiosk' | '/booth/display'): Promise<void> {
  const account = await getBoothAccount();
  if (!account.hash) return;
  if (!(await isBooth())) redirect(`/booth/login?next=${encodeURIComponent(next)}`);
}

// ---- API routes ----

/**
 * Refuses a request that a browser made on behalf of another website. Cookies use
 * SameSite=Lax, which already stops most of that, and this is the second lock: a
 * change made by POST must come from this site. (curl and scripts send neither header
 * and are not a CSRF risk, because they do not carry the cookie by themselves.)
 */
export function assertSameOrigin(request: Request): void {
  const site = request.headers.get('sec-fetch-site');
  if (site && site !== 'same-origin' && site !== 'none') throw new ApiError(403, 'cross_site');
  const origin = request.headers.get('origin');
  if (origin) {
    const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host');
    let originHost = '';
    try {
      originHost = new URL(origin).host;
    } catch {
      /* falls through to the refusal below */
    }
    if (!host || originHost !== host) throw new ApiError(403, 'cross_site');
  }
}

/** For an /api/admin/* route: must be the admin, and (for a change) from this site. */
export async function assertAdmin(request: Request): Promise<void> {
  if (request.method !== 'GET' && request.method !== 'HEAD') assertSameOrigin(request);
  if (!(await adminConfig())) throw new ApiError(503, 'not_configured');
  if (!(await isAdmin())) throw new ApiError(401, 'unauthorized');
}

// ---- cookies ----

/** Secure only over HTTPS (directly, or as reported by the proxy in front). */
function isHttps(request: Request): boolean {
  return new URL(request.url).protocol === 'https:' || request.headers.get('x-forwarded-proto') === 'https';
}

/**
 * Signs someone in: a signed, httpOnly, SameSite=Lax cookie that expires on its own
 * (8 hours for the admin, 12 for the booth). The booth cookie is sent only under
 * /booth, so it never even travels to /admin.
 */
export async function signIn(request: Request, role: Role, passwordHash: string): Promise<void> {
  const ms = SESSION_MS[role];
  const token = signToken({ role, exp: Date.now() + ms, v: passwordVersion(passwordHash) }, await getSessionSecret());
  (await cookies()).set(role === 'admin' ? ADMIN_COOKIE : BOOTH_COOKIE, token, {
    httpOnly: true,
    secure: isHttps(request),
    sameSite: 'lax',
    path: role === 'admin' ? '/' : '/booth',
    maxAge: Math.floor(ms / 1000),
  });
}

export async function signOut(role: Role): Promise<void> {
  (await cookies()).set(role === 'admin' ? ADMIN_COOKIE : BOOTH_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    path: role === 'admin' ? '/' : '/booth',
    maxAge: 0,
  });
}
