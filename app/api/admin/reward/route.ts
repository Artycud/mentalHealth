import { z } from 'zod';

import { fail, ok, parse, readJson } from '@/lib/api';
import { assertAdmin } from '@/lib/guard';
import { setRewardOn } from '@/lib/settings';

/**
 * POST /api/admin/reward: whether the booth's coupon is still being given out. The
 * TV and the kiosk read it on their next refresh, so switching it off stops both
 * from promising a coupon the booth no longer has.
 */
const Body = z.object({ on: z.boolean() });

export async function POST(request: Request) {
  try {
    await assertAdmin(request);
    const { on } = parse(Body, await readJson(request));
    await setRewardOn(on);
    return ok({ ok: true, on });
  } catch (error) {
    return fail(error);
  }
}
