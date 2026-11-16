import { json } from '@/lib/vent/http';
import { setTyping } from '@/lib/vent/threads';

/**
 * POST /api/vent/<key>/typing — the student is typing (sent at most every 3 seconds
 * while they type), so the พี่สภา team sees "น้องกำลังพิมพ์…". Nothing of what they
 * type is sent: only that they are typing. Writes at most once every 2 seconds.
 */

type Ctx = { params: Promise<{ key: string }> };

export async function POST(_request: Request, { params }: Ctx) {
  const { key } = await params;
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(key)) return json({ ok: true });
  try {
    await setTyping({ id: key });
  } catch {
    // A missed typing mark is nothing: the next one comes in 3 seconds.
  }
  return json({ ok: true });
}
