import { answersCsv, exportFilename, parseFilters, sessionsCsv } from '@/lib/admin-data';
import { fail } from '@/lib/api';
import { assertAdmin } from '@/lib/guard';
import { ApiError } from '@/lib/session';

/**
 * GET /api/admin/export?kind=sessions|answers&…filters (BRIEF §11): a CSV of what the
 * panel is showing, one row per session or one per answer. UTF-8 with a byte-order
 * mark so Excel reads the Thai. Anonymous like everything else: there is nothing in it
 * that names anyone.
 */
export async function GET(request: Request) {
  try {
    await assertAdmin(request);
    const params = new URL(request.url).searchParams;
    const kind = params.get('kind');
    if (kind !== 'sessions' && kind !== 'answers') throw new ApiError(400, 'bad_request');
    const filters = parseFilters(Object.fromEntries(params));
    const body = kind === 'sessions' ? await sessionsCsv(filters) : await answersCsv(filters);
    return new Response(body, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${exportFilename(kind)}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    return fail(error);
  }
}
