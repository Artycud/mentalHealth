import { z } from 'zod';

import { fail, ok, parse } from '@/lib/api';
import { assertSapa } from '@/lib/guard';
import { smallJson } from '@/lib/vent/http';
import { claimThread, cleanName } from '@/lib/vent/threads';
import { ApiError } from '@/lib/session';

/**
 * POST /api/sapa/threads/<ref>/claim { by } — a พี่ takes this chat on: they are the
 * one responsible for it (others can still answer). { by, release: true } lets it go.
 */

type Ctx = { params: Promise<{ ref: string }> };
const Body = z.object({ by: z.string().max(60), release: z.boolean().optional() });

export async function POST(request: Request, { params }: Ctx) {
  try {
    await assertSapa(request);
    const body = parse(Body, await smallJson(request));
    const by = cleanName(body.by);
    if (!by) throw new ApiError(400, 'bad_request');
    if (!(await claimThread((await params).ref, body.release ? null : by))) throw new ApiError(404, 'gone');
    return ok({ ok: true });
  } catch (error) {
    return fail(error);
  }
}
