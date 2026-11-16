import { fail, ok } from '@/lib/api';
import { assertSapa } from '@/lib/guard';
import { inbox, teamToday } from '@/lib/vent/threads';

/** GET /api/sapa/threads: every open ระบาย conversation (urgent and unanswered first), and today's team. */
export async function GET(request: Request) {
  try {
    await assertSapa(request);
    const [threads, team] = await Promise.all([inbox(), teamToday()]);
    return ok({ threads, team });
  } catch (error) {
    return fail(error);
  }
}
