import { z } from 'zod';

import { fail, ok, parse, readJson } from '@/lib/api';
import { attemptLogin, getBoothAccount } from '@/lib/auth';
import { assertSameOrigin, signIn } from '@/lib/guard';
import { ApiError } from '@/lib/session';

/**
 * POST /api/booth/login: the kiosk and the TV signing in (BRIEF §11). Its own account
 * and its own cookie, which reaches only /booth/kiosk and /booth/display and can never
 * open /admin. Its own lockout too, so guessing here does not lock out the council.
 */
const Body = z.object({
  username: z.string().min(1).max(64),
  password: z.string().min(1).max(200),
});

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const account = await getBoothAccount();
    // No password yet means the booth screens are open and there is nothing to sign in to.
    if (!account.hash) throw new ApiError(409, 'not_ready');
    const body = parse(Body, await readJson(request));
    const result = await attemptLogin('booth', body, { username: account.username, hash: account.hash });
    if (result === 'locked') throw new ApiError(429, 'locked');
    if (result === 'wrong') throw new ApiError(401, 'wrong');
    await signIn(request, 'booth', account.hash);
    return ok({ ok: true });
  } catch (error) {
    return fail(error);
  }
}
