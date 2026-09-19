import { z } from 'zod';

import { fail, ok, parse, readJson } from '@/lib/api';
import { saveAnswer } from '@/lib/session';

/**
 * POST /api/session/:id/answer — record one answer, replacing an earlier one to
 * the same question. The ids are checked against the real content, so anything
 * that is not a question and a choice we wrote is refused (BRIEF §3).
 */
const Body = z.object({
  questionId: z.string().min(1).max(64),
  choiceId: z.string().min(1).max(16),
});

export async function POST(request: Request, ctx: RouteContext<'/api/session/[id]/answer'>) {
  try {
    const { id } = await ctx.params;
    const body = parse(Body, await readJson(request));
    await saveAnswer(id, body.questionId, body.choiceId);
    return ok({ ok: true });
  } catch (error) {
    return fail(error);
  }
}
