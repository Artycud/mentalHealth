import { z } from 'zod';

import { fail, ok, parse, readJson } from '@/lib/api';
import { assertAdmin } from '@/lib/guard';
import { setActiveFestival } from '@/lib/settings';

/**
 * POST /api/admin/festival: which booth is live (BRIEF §11). Takes effect on the next
 * student page load. Past sessions keep the festival they were recorded under.
 */
const Body = z.object({ festival: z.enum(['loykrathong', 'christmas', 'cny-valentine', 'none']) });

export async function POST(request: Request) {
  try {
    await assertAdmin(request);
    const { festival } = parse(Body, await readJson(request));
    await setActiveFestival(festival);
    return ok({ ok: true, festival });
  } catch (error) {
    return fail(error);
  }
}
