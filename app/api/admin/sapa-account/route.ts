import { z } from 'zod';

import { fail, ok, parse, readJson } from '@/lib/api';
import { getSapaAccount, regenerateSapaPassword, setSapaPassword, validSapaPassword } from '@/lib/auth';
import { assertAdmin } from '@/lib/guard';
import { ApiError } from '@/lib/session';
import { discordMode } from '@/lib/vent/discord';

/**
 * POST /api/admin/sapa-account: the shared password for the พี่สภา team (who
 * answer ระบาย at /sapa). Either `{ password }`, one the admin chose, or `{}` for
 * a made-up one returned in this response ONCE. Stored only as a hash either way;
 * a new one signs the whole team out. Also says whether Discord pings are set up.
 */
const Body = z.object({ password: z.string().max(200).optional() });

export async function POST(request: Request) {
  try {
    await assertAdmin(request);
    const body = parse(Body, await readJson(request));
    let password: string | undefined;
    if (body.password !== undefined) {
      if (!validSapaPassword(body.password)) throw new ApiError(400, 'bad_password');
      await setSapaPassword(body.password);
    } else {
      password = await regenerateSapaPassword();
    }
    const account = await getSapaAccount();
    return ok({ ok: true, hasPassword: account.hash !== null, password, discord: discordMode() });
  } catch (error) {
    return fail(error);
  }
}
