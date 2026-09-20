import { z } from 'zod';

import { fail, ok, parse, readJson } from '@/lib/api';
import { getEventText, setEvent } from '@/lib/events';
import { assertAdmin } from '@/lib/guard';
import { ApiError } from '@/lib/session';
import { parseIsoDate } from '@/lib/thai-date';
import type { FestivalId } from '@/lib/types';

/**
 * PUT /api/admin/events/:festival: when and where a booth runs (BRIEF §11). Separate
 * from which booth is live: changing a date never switches the festival, and the other
 * way round.
 *
 * An end date before the start is treated as a single day rather than refused, so a
 * typo can never blank a public screen. Blank time or place falls back to the default.
 */
const FESTIVALS = ['loykrathong', 'christmas', 'cny-valentine'] as const;

const Body = z.object({
  start: z.string().max(10),
  end: z.string().max(10),
  time: z.string().max(60),
  place: z.string().max(60),
});

export async function PUT(request: Request, ctx: RouteContext<'/api/admin/events/[festival]'>) {
  try {
    await assertAdmin(request);
    const { festival } = await ctx.params;
    if (!FESTIVALS.includes(festival as FestivalId)) throw new ApiError(404, 'not_found');
    const body = parse(Body, await readJson(request));

    if (!parseIsoDate(body.start)) throw new ApiError(400, 'bad_date');
    const end = parseIsoDate(body.end) && body.end >= body.start ? body.end : body.start;

    await setEvent({
      festival: festival as FestivalId,
      start: body.start,
      end,
      time: body.time.trim(),
      place: body.place.trim(),
    });
    return ok({ ok: true, singleDay: end !== body.end, text: await getEventText(festival as FestivalId) });
  } catch (error) {
    return fail(error);
  }
}
