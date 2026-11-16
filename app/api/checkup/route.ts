import { z } from 'zod';

import { checkup } from '@/content/th/checkup';
import { bump } from '@/lib/tally';
import { takeVentSlot } from '@/lib/vent/cap';
import { json, smallJson } from '@/lib/vent/http';

/**
 * POST /api/checkup — the topics a student picked in the heart check-up, counted
 * for the booth recap's "เรื่องที่อยู่ในหัวมากสุด". Only today's count for each
 * topic goes up (lib/tally.ts): no session, no time, nothing about who. The page
 * sends it once a day per phone; a global per-minute ceiling stops anyone stuffing it.
 */

const Topic = z.enum(checkup.topics.options);
const Body = z.object({ topics: z.array(Topic).min(1).max(checkup.topics.options.length) });

export async function POST(request: Request) {
  try {
    const body = Body.safeParse(await smallJson(request));
    if (!body.success) return json({ error: 'bad_request' }, 400);
    if (!(await takeVentSlot(new Date(), 'tally'))) return json({ error: 'busy' }, 429);
    const topics = [...new Set(body.data.topics)];
    await bump(['checkup:topics', ...topics.map((t) => `topic:${t}`)]);
    return json({ ok: true });
  } catch (error) {
    console.error('checkup tally: failed', error instanceof Error ? error.name : 'unknown');
    return json({ error: 'unavailable' }, 503);
  }
}
