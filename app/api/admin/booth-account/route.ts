import { z } from 'zod';

import { getBoothAccount, regenerateBoothPassword, setBoothUsername, validBoothUsername } from '@/lib/auth';
import { fail, ok, parse, readJson } from '@/lib/api';
import { assertAdmin } from '@/lib/guard';
import { ApiError } from '@/lib/session';

/**
 * POST /api/admin/booth-account: the account the kiosk and the TV sign in with
 * (BRIEF §11). Rename it, and/or make a new password.
 *
 * A new password is returned in this response ONCE and stored only as a hash, so nobody
 * can read it back later, not even an admin: forgotten means reset, not recovered.
 * Making a new one also signs out every booth device, because their cookies are tied
 * to the old password.
 */
const Body = z.object({
  username: z.string().max(40).optional(),
  regenerate: z.boolean().optional(),
});

export async function POST(request: Request) {
  try {
    await assertAdmin(request);
    const body = parse(Body, await readJson(request));

    if (body.username !== undefined) {
      const name = body.username.trim();
      if (!validBoothUsername(name)) throw new ApiError(400, 'bad_username');
      await setBoothUsername(name);
    }
    const password = body.regenerate ? await regenerateBoothPassword() : undefined;

    const account = await getBoothAccount();
    return ok({ ok: true, username: account.username, hasPassword: account.hash !== null, password });
  } catch (error) {
    return fail(error);
  }
}
