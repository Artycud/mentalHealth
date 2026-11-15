import { z } from 'zod';

import { takeVentSlot } from '@/lib/vent/cap';
import { failed, json, smallJson } from '@/lib/vent/http';
import { keyForCode, normaliseCode } from '@/lib/vent/threads';

/**
 * POST /api/vent/code { code } — a student coming back from another phone with
 * their chat code. Returns their key, which that phone then keeps. Lookups are
 * capped per minute across everyone (lib/vent/cap.ts), so codes cannot be guessed.
 */

const Body = z.object({ code: z.string().max(20) });

export async function POST(request: Request) {
  try {
    const body = Body.safeParse(await smallJson(request));
    if (!body.success) return json({ error: 'bad_request' }, 400);
    if (!(await takeVentSlot(new Date(), 'code'))) return json({ error: 'busy' }, 429);
    const code = normaliseCode(body.data.code);
    const key = code ? await keyForCode(code) : null;
    return key ? json({ key, code }) : json({ error: 'not_found' }, 404);
  } catch (error) {
    return failed('code', error);
  }
}
