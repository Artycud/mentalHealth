import { completeSession } from '@/lib/session';
import { fail, ok, readJson } from '@/lib/api';

/**
 * POST /api/session/:id/complete — finish a run.
 *
 * The body is read (so it is size-capped like every other) and then ignored: the
 * result is recomputed on the server from the stored answers and the server's
 * value is the one kept, so a client cannot post a result of its own (BRIEF §3).
 * Completing twice returns the first result, because the phone retries once.
 */
export async function POST(request: Request, ctx: RouteContext<'/api/session/[id]/complete'>) {
  try {
    const { id } = await ctx.params;
    await readJson(request);
    return ok(await completeSession(id));
  } catch (error) {
    return fail(error);
  }
}
