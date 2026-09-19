import { z } from 'zod';

import { fail, ok, parse, readJson } from '@/lib/api';
import { createSession } from '@/lib/session';

/**
 * POST /api/session — start a run. Returns `{ id }`.
 *
 * `mode` says which quiz. `device` is the viewport bucket the browser worked out
 * from its own width, nothing more (BRIEF §3). The festival is NOT taken from the
 * caller: the server reads which one is live, so a client cannot label its own
 * session as another booth's.
 */
const Body = z.object({
  mode: z.enum(['checkin', 'booth']),
  device: z.enum(['mobile', 'tablet', 'desktop']).optional(),
});

export async function POST(request: Request) {
  try {
    const body = parse(Body, await readJson(request));
    return ok(await createSession(body), 201);
  } catch (error) {
    return fail(error);
  }
}
