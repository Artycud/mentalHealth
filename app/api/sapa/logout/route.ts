import { fail, ok } from '@/lib/api';
import { assertSameOrigin, signOut } from '@/lib/guard';

/** POST /api/sapa/logout: the พี่สภา cookie, gone. */
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    await signOut('sapa');
    return ok({ ok: true });
  } catch (error) {
    return fail(error);
  }
}
