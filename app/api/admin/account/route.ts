import { z } from 'zod';

import { fail, ok, parse, readJson } from '@/lib/api';
import { attemptLogin, changeAdminPassword, passwordProblem } from '@/lib/auth';
import { adminConfig, assertAdmin, signIn } from '@/lib/guard';
import { ApiError } from '@/lib/session';

/**
 * POST /api/admin/account: change the admin password (BRIEF §11). Asks for the current
 * one again, so someone who walks up to a signed-in laptop cannot lock the council out,
 * and counts wrong guesses like a login does. A password set by the server's
 * environment is changed there, not here.
 *
 * Changing it signs out every other session (their cookies are tied to the old
 * password), and this one is signed in again with the new one.
 */
const Body = z.object({
  currentPassword: z.string().min(1).max(200),
  newPassword: z.string().min(1).max(200),
});

export async function POST(request: Request) {
  try {
    await assertAdmin(request);
    const config = await adminConfig();
    if (!config) throw new ApiError(503, 'not_configured');
    if (config.source !== 'stored') throw new ApiError(409, 'managed_by_server');
    const body = parse(Body, await readJson(request));

    const result = await attemptLogin('admin', { username: config.username, password: body.currentPassword }, config);
    if (result === 'locked') throw new ApiError(429, 'locked');
    // 403, not 401: a 401 makes the panel think the sign-in expired and sends you away.
    if (result === 'wrong') throw new ApiError(403, 'wrong_password');
    if (passwordProblem(body.newPassword, config.username)) throw new ApiError(400, 'weak_password');

    const hash = await changeAdminPassword(body.newPassword);
    await signIn(request, 'admin', hash);
    return ok({ ok: true });
  } catch (error) {
    return fail(error);
  }
}
