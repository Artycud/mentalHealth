import { z } from 'zod';

import { fail, ok, parse, readJson } from '@/lib/api';
import { attemptLogin } from '@/lib/auth';
import { adminConfig, assertSameOrigin, signIn } from '@/lib/guard';
import { ApiError } from '@/lib/session';

/**
 * POST /api/admin/login. One account, from the environment (BRIEF §11). Five wrong
 * tries lock it for ten minutes, counted in the database so it holds across restarts.
 * The answer never says whether the username or the password was the wrong half.
 */
const Body = z.object({
  username: z.string().min(1).max(64),
  password: z.string().min(1).max(200),
});

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const config = await adminConfig();
    if (!config) throw new ApiError(503, 'not_configured');
    const body = parse(Body, await readJson(request));
    const result = await attemptLogin('admin', body, { username: config.username, hash: config.hash });
    if (result === 'locked') throw new ApiError(429, 'locked');
    if (result === 'wrong') throw new ApiError(401, 'wrong');
    await signIn(request, 'admin', config.hash);
    return ok({ ok: true });
  } catch (error) {
    return fail(error);
  }
}
