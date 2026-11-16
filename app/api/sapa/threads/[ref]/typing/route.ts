import { z } from 'zod';

import { fail, ok, parse } from '@/lib/api';
import { assertSapa } from '@/lib/guard';
import { smallJson } from '@/lib/vent/http';
import { cleanName, setTyping } from '@/lib/vent/threads';
import { ApiError } from '@/lib/session';

/**
 * POST /api/sapa/threads/<ref>/typing { by } — a พี่ is typing an answer. The page
 * sends it at most every 3 seconds while they type; the student and the rest of
 * the team see "<by> กำลังพิมพ์…" on their next look.
 */

type Ctx = { params: Promise<{ ref: string }> };
const Body = z.object({ by: z.string().max(60) });

export async function POST(request: Request, { params }: Ctx) {
  try {
    await assertSapa(request);
    const by = cleanName(parse(Body, await smallJson(request)).by);
    if (!by) throw new ApiError(400, 'bad_request');
    await setTyping({ ref: (await params).ref, by });
    return ok({ ok: true });
  } catch (error) {
    return fail(error);
  }
}
