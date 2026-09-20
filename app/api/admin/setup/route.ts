import { z } from 'zod';

import { fail, ok, parse, readJson } from '@/lib/api';
import {
  clearSetupCode, createAdminAccount, getSetupCode, lockRemainingMs, passwordProblem, recordFailure, recordSuccess,
  safeEqual, validAdminUsername,
} from '@/lib/auth';
import { adminConfig, assertSameOrigin, setupNeedsCode, signIn } from '@/lib/guard';
import { ApiError } from '@/lib/session';

/**
 * POST /api/admin/setup: makes the admin account, once (BRIEF §11). It is refused the
 * moment an account exists, so it can never be used to take over a running panel.
 *
 * On a live server it also needs the setup code from the server's log or from
 * data/admin-setup-code-app.txt (see lib/auth.ts), so a stranger who reaches the page first
 * cannot claim it. Wrong codes are counted and lock the setup for ten minutes, like a
 * wrong password. The password is stored only as a hash, and the new admin is signed in
 * straight away.
 */
const Body = z.object({
  username: z.string().min(1).max(64),
  password: z.string().min(1).max(200),
  code: z.string().max(40).optional(),
});

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    if (await adminConfig()) throw new ApiError(409, 'already_set');
    const body = parse(Body, await readJson(request));

    if (setupNeedsCode()) {
      if ((await lockRemainingMs('setup')) > 0) throw new ApiError(429, 'locked');
      const given = (body.code ?? '').trim().toLowerCase();
      if (!given || !safeEqual(given, (await getSetupCode()).toLowerCase())) {
        const { locked } = await recordFailure('setup');
        throw new ApiError(locked ? 429 : 403, locked ? 'locked' : 'bad_code');
      }
    }

    const username = body.username.trim();
    if (!validAdminUsername(username)) throw new ApiError(400, 'bad_username');
    if (passwordProblem(body.password, username)) throw new ApiError(400, 'weak_password');

    if (!(await createAdminAccount(username, body.password))) throw new ApiError(409, 'already_set');
    await clearSetupCode();
    await recordSuccess('setup');
    // Signed in at once, with the hash that was just stored.
    const config = await adminConfig();
    if (!config) throw new Error('the admin account was not saved');
    await signIn(request, 'admin', config.hash);
    return ok({ ok: true });
  } catch (error) {
    return fail(error);
  }
}
