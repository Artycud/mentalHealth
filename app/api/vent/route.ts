import { z } from 'zod';

import { takeVentSlot } from '@/lib/vent/cap';
import { notifySapa } from '@/lib/vent/discord';
import { failed, json, smallJson, Text } from '@/lib/vent/http';
import { needsCare } from '@/lib/vent/safety';
import { setDiscordId, startThread } from '@/lib/vent/threads';

/**
 * POST /api/vent — a student starts ระบาย: their first message is saved for the
 * พี่สภา team, who are pinged in Discord (without the words). Returns the student's
 * own key (their phone keeps it) and the chat code (their way back in from
 * anywhere else). `care` says the message may mean danger: the page shows the
 * reviewed care screen at once, and the conversation is marked urgent for the team.
 */

const Body = z.object({ text: Text, feel: z.string().regex(/^[0-2]-[0-2]$/).optional() });

export async function POST(request: Request) {
  try {
    const body = Body.safeParse(await smallJson(request));
    if (!body.success) return json({ error: 'bad_request' }, 400);
    if (!(await takeVentSlot())) return json({ error: 'busy' }, 429);

    const care = needsCare(body.data.text);
    const thread = await startThread(body.data.text, { feel: body.data.feel, urgent: care });
    const discordId = await notifySapa({ ref: thread.ref, urgent: care, isNew: true, origin: new URL(request.url).origin });
    if (discordId) await setDiscordId(thread.ref, discordId);

    return json({ key: thread.id, code: thread.code, care });
  } catch (error) {
    return failed('start', error);
  }
}
