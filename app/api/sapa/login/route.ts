import { z } from 'zod';

import { fail, ok, parse, readJson } from '@/lib/api';
import { attemptLogin, getSapaAccount, SAPA_USERNAME } from '@/lib/auth';
import { assertSameOrigin, signIn } from '@/lib/guard';
import { ApiError } from '@/lib/session';

/**
 * POST /api/sapa/login: the พี่สภา team signing in to answer ระบาย, with the one
 * shared password the admin generated. Its own cookie and its own lockout, so
 * guessing here locks neither the council's admin nor the booth.
 */
const Body = z.object({ password: z.string().min(1).max(200) });

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const account = await getSapaAccount();
    if (!account.hash) throw new ApiError(409, 'not_ready');
    const body = parse(Body, await readJson(request));
    const result = await attemptLogin('sapa', { username: SAPA_USERNAME, password: body.password }, { username: SAPA_USERNAME, hash: account.hash });
    if (result === 'locked') throw new ApiError(429, 'locked');
    if (result === 'wrong') throw new ApiError(401, 'wrong');
    await signIn(request, 'sapa', account.hash);
    return ok({ ok: true });
  } catch (error) {
    return fail(error);
  }
}
