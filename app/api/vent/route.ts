import { z } from 'zod';

import { ok } from '@/lib/api';
import { feelings } from '@/content/th/heart';
import { takeVentSlot } from '@/lib/vent/cap';
import { getProvider } from '@/lib/vent/provider';
import { respond } from '@/lib/vent/respond';

/**
 * POST /api/vent — one turn of ระบาย. Takes the conversation so far (the page
 * holds it; the server keeps nothing) and returns the next answer.
 *
 * PRIVACY: the body is never logged, stored or echoed in an error. Failures are
 * answered with a bare code and logged by name only (lib/vent/respond.ts).
 */

/** Up to 20 lines of up to 1,200 characters: Thai is 3 bytes a character. */
const MAX_BYTES = 80_000;

const Body = z.object({
  messages: z
    .array(z.object({ role: z.enum(['user', 'ai']), text: z.string().trim().min(1).max(1200) }))
    .min(1)
    .max(20)
    .refine((m) => m[m.length - 1].role === 'user'),
  feel: z.string().regex(/^[0-2]-[0-2]$/).optional(),
});

export async function POST(request: Request) {
  try {
    if (Number(request.headers.get('content-length') ?? 0) > MAX_BYTES) return ok({ error: 'too_large' }, 413);
    const text = await request.text();
    if (text.length > MAX_BYTES) return ok({ error: 'too_large' }, 413);

    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      return ok({ error: 'bad_json' }, 400);
    }
    const body = Body.safeParse(data);
    if (!body.success) return ok({ error: 'bad_request' }, 400);

    if (!(await takeVentSlot())) return ok({ kind: 'busy' });

    const [row, col] = body.data.feel?.split('-').map(Number) ?? [];
    const feeling = body.data.feel ? feelings[row][col].word : undefined;

    return ok(await respond({ messages: body.data.messages, feeling }, getProvider()));
  } catch (error) {
    console.error('vent: failed', error instanceof Error ? error.name : 'unknown');
    return ok({ kind: 'unavailable' });
  }
}
