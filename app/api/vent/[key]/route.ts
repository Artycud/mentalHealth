import { after } from 'next/server';
import { z } from 'zod';

import { siteOrigin } from '@/lib/site-url';
import { takeVentSlot } from '@/lib/vent/cap';
import { markEnded, notifySapa, sweepQueue } from '@/lib/vent/discord';
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
    const afterId = Number(new URL(request.url).searchParams.get('after') ?? 0) || 0;
    const thread = await readThread(key, afterId);
    // A student is waiting on this page: after answering, see whether the team
    // needs a nudge (lib/vent/discord.ts sweepQueue; at most once a minute).
    if (thread?.waiting) {
      const origin = await siteOrigin();
      after(() => sweepQueue(origin));
    }
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

    // Every message pings; a burst within a minute is merged into one ping (lib/vent/discord.ts).
    const discordId = await notifySapa({ ref: saved.ref, urgent: care, isNew: false, origin: await siteOrigin() });
    if (discordId) await setDiscordId(saved.ref, discordId);
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
