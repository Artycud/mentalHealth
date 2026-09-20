import { z } from 'zod';

import { wipeAll } from '@/lib/admin-data';
import { fail, ok, parse, readJson } from '@/lib/api';
import { assertAdmin } from '@/lib/guard';
import { ApiError } from '@/lib/session';
import { WIPE_WORD } from '@/content/th/admin';

/**
 * POST /api/admin/wipe: deletes every session and answer (BRIEF §11), for when the
 * report is done. It takes a person typing the confirmation word, so a stray request
 * or a curious click cannot do it. The live festival, the dates and both accounts stay.
 */
const Body = z.object({ confirm: z.string().max(60) });

export async function POST(request: Request) {
  try {
    await assertAdmin(request);
    const body = parse(Body, await readJson(request));
    if (body.confirm.trim() !== WIPE_WORD) throw new ApiError(400, 'wrong_word');
    return ok({ ok: true, removed: await wipeAll(body.confirm) });
  } catch (error) {
    return fail(error);
  }
}
