import { cookies } from 'next/headers';
import { z } from 'zod';

import { fail, ok, parse } from '@/lib/api';
import { assertSapa } from '@/lib/guard';
import { smallJson } from '@/lib/vent/http';
import { cleanName } from '@/lib/vent/threads';
import { ApiError } from '@/lib/session';
import { SAPA_NAME_COOKIE } from '@/lib/vent/name';

/**
 * POST /api/sapa/name { name }: this device's nickname, kept in a cookie for 400
 * days (the longest a browser keeps one), so a พี่ is asked once, not every visit.
 * Set from the server so Safari doesn't cut it to a week as it does script cookies.
 * Signing out of the team leaves it, so the next login goes straight to the inbox.
 */
const Body = z.object({ name: z.string().max(60) });

export async function POST(request: Request) {
  try {
    await assertSapa(request);
    const name = cleanName(parse(Body, await smallJson(request)).name);
    if (!name) throw new ApiError(400, 'bad_request');
    const url = new URL(request.url);
    (await cookies()).set(SAPA_NAME_COOKIE, name, {
      httpOnly: true,
      secure: url.protocol === 'https:' || request.headers.get('x-forwarded-proto') === 'https',
      sameSite: 'lax',
      path: '/sapa',
      maxAge: 400 * 24 * 60 * 60,
    });
    return ok({ ok: true });
  } catch (error) {
    return fail(error);
  }
}
