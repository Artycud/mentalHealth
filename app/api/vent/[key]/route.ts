import { z } from 'zod';

import { takeVentSlot } from '@/lib/vent/cap';
import { markEnded, notifySapa } from '@/lib/vent/discord';
import { failed, json, smallJson, Text } from '@/lib/vent/http';
import { needsCare } from '@/lib/vent/safety';
import { addMessage, endThread, readThread, setDiscordId } from '@/lib/vent/threads';

/**
 * One student's conversation, by their own key (kept on their phone):
 *   GET     ?after=<id>  the conversation, or what is new since a message id
 *   POST    { text }     another message from the student
 *   DELETE               ends it: everything in it is deleted
 * A key that no longer exists (ended, or 30 days quiet) answers 404 `gone`.
 */

type Ctx = { params: Promise<{ key: string }> };
const valid = (key: string) => /^[A-Za-z0-9_-]{20,64}$/.test(key);

export async function GET(request: Request, { params }: Ctx) {
  try {
    const { key } = await params;
    if (!valid(key)) return json({ error: 'gone' }, 404);
    const after = Number(new URL(request.url).searchParams.get('after') ?? 0) || 0;
    const thread = await readThread(key, after);
    return thread ? json(thread) : json({ error: 'gone' }, 404);
  } catch (error) {
    return failed('read', error);
  }
}

const Body = z.object({ text: Text });

export async function POST(request: Request, { params }: Ctx) {
  try {
    const { key } = await params;
    if (!valid(key)) return json({ error: 'gone' }, 404);
    const body = Body.safeParse(await smallJson(request));
    if (!body.success) return json({ error: 'bad_request' }, 400);
    if (!(await takeVentSlot())) return json({ error: 'busy' }, 429);

    const care = needsCare(body.data.text);
    const saved = await addMessage({ id: key }, 'student', body.data.text, care);
    if (!saved) return json({ error: 'gone' }, 404);
    if (saved.full) return json({ error: 'full' }, 409);

    // Ping only when a พี่ had answered (or it just turned urgent): one ping per
    // turn, not one per message while they are still writing.
    if (!saved.wasWaiting || care) {
      const discordId = await notifySapa({ ref: saved.ref, urgent: saved.urgent, isNew: false, origin: new URL(request.url).origin });
      if (discordId) await setDiscordId(saved.ref, discordId);
    }
    return json({ ok: true, care });
  } catch (error) {
    return failed('add', error);
  }
}

export async function DELETE(_request: Request, { params }: Ctx) {
  try {
    const { key } = await params;
    if (!valid(key)) return json({ ok: true });
    const ended = await endThread(key);
    if (ended) await markEnded(ended.discordId);
    return json({ ok: true });
  } catch (error) {
    return failed('end', error);
  }
}
