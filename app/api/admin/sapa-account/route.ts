import { fail, ok } from '@/lib/api';
import { getSapaAccount, regenerateSapaPassword } from '@/lib/auth';
import { assertAdmin } from '@/lib/guard';
import { discordMode } from '@/lib/vent/discord';

/**
 * POST /api/admin/sapa-account: a new shared password for the พี่สภา team (who
 * answer ระบาย at /sapa). Returned in this response ONCE and stored only as a
 * hash; making a new one signs the whole team out. Also says whether Discord
 * pings are set up.
 */
export async function POST(request: Request) {
  try {
    await assertAdmin(request);
    const password = await regenerateSapaPassword();
    const account = await getSapaAccount();
    return ok({ ok: true, hasPassword: account.hash !== null, password, discord: discordMode() });
  } catch (error) {
    return fail(error);
  }
}
