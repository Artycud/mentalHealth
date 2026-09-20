import { fail, ok } from '@/lib/api';
import { assertSameOrigin, signOut } from '@/lib/guard';

/** POST /api/admin/logout: clears the cookie. Safe to call when not signed in. */
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    await signOut('admin');
    return ok({ ok: true });
  } catch (error) {
    return fail(error);
  }
}
