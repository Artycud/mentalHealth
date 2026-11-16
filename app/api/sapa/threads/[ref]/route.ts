import { z } from 'zod';

import { fail, ok, parse } from '@/lib/api';
import { assertSapa } from '@/lib/guard';
import { smallJson, Text } from '@/lib/vent/http';
import { addMessage, cleanName, readForStaff } from '@/lib/vent/threads';
import { ApiError } from '@/lib/session';

/**
 * One ระบาย conversation for the พี่สภา team, by its staff ref:
 *   GET                   the whole conversation, who claimed it, who is typing
 *   POST { text, by }     a พี่'s answer, signed with their nickname, which the
 *                         student sees on their next look
 */

type Ctx = { params: Promise<{ ref: string }> };

export async function GET(request: Request, { params }: Ctx) {
  try {
    await assertSapa(request);
    const thread = await readForStaff((await params).ref);
    if (!thread) throw new ApiError(404, 'gone');
    return ok(thread);
  } catch (error) {
    return fail(error);
  }
}

const Body = z.object({ text: Text, by: z.string().max(60).optional() });

export async function POST(request: Request, { params }: Ctx) {
  try {
    await assertSapa(request);
    const body = parse(Body, await smallJson(request));
    const saved = await addMessage({ ref: (await params).ref }, 'sapa', body.text, false, cleanName(body.by));
    if (!saved) throw new ApiError(404, 'gone');
    if (saved.full) throw new ApiError(409, 'full');
    return ok({ ok: true });
  } catch (error) {
    return fail(error);
  }
}
