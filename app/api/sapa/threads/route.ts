import { fail, ok } from '@/lib/api';
import { assertSapa } from '@/lib/guard';
import { inbox } from '@/lib/vent/threads';

/** GET /api/sapa/threads: every open ระบาย conversation, urgent and unanswered first. */
export async function GET(request: Request) {
  try {
    await assertSapa(request);
    return ok({ threads: await inbox() });
  } catch (error) {
    return fail(error);
  }
}
