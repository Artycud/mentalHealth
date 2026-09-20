import { deleteSession } from '@/lib/admin-data';
import { fail, ok } from '@/lib/api';
import { assertAdmin } from '@/lib/guard';
import { ApiError } from '@/lib/session';

/** DELETE /api/admin/sessions/:id: removes one session and its answers (BRIEF §11). */
export async function DELETE(request: Request, ctx: RouteContext<'/api/admin/sessions/[id]'>) {
  try {
    await assertAdmin(request);
    const { id } = await ctx.params;
    const removed = await deleteSession(id);
    if (removed === 0) throw new ApiError(404, 'not_found');
    return ok({ ok: true });
  } catch (error) {
    return fail(error);
  }
}
