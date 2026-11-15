import { fail, ok } from '@/lib/api';
import { assertAdmin } from '@/lib/guard';
import { testDiscord } from '@/lib/vent/discord';

/**
 * POST /api/admin/discord-test: sends one test ping to the พี่สภา Discord channel
 * and says what happened (sent, not set up, a wrong address, or Discord refused),
 * so a setup mistake shows in the admin panel instead of only in the logs.
 */
export async function POST(request: Request) {
  try {
    await assertAdmin(request);
    return ok(await testDiscord(new URL(request.url).origin));
  } catch (error) {
    return fail(error);
  }
}
