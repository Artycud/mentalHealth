import { eventFacts } from '../content/th/common.ts';

import { db } from './db.ts';
import { formatDateRange, parseIsoDate } from './thai-date.ts';
import type { FestivalId } from './types';

/**
 * When and where each booth runs.
 *
 * This is the one place that answers "when is the booth". The home page, the
 * kiosk, the TV and the booth ticket all read it, so changing a date here changes
 * it everywhere.
 *
 * The values in DEFAULT_EVENTS come from the approved project document. The admin
 * panel's กิจกรรม (Events) section (phase 5) writes the `event` table, and a row
 * there OVERRIDES the default for that festival, field by field. A festival with
 * no row — every one, on a fresh database — shows the defaults, so a new
 * deployment always has sensible dates. Dates move, and this project has already
 * met one document that disagreed with itself about two of them (see BRIEF.md).
 *
 * Dates are ISO calendar dates, formatted for display by lib/thai-date.ts.
 * Imports are relative with `.ts` so scripts/test-db.mjs can load this in Node.
 */

export interface EventInfo {
  festival: FestivalId;
  /** First booth day, "YYYY-MM-DD". */
  start: string;
  /** Last booth day, inclusive. Equal to `start` for a one-day booth. */
  end: string;
  /** Free text, as written on a school notice: "11.10–12.50 น.". */
  time: string;
  place: string;
}

export const DEFAULT_EVENTS: Record<FestivalId, EventInfo> = {
  loykrathong: {
    festival: 'loykrathong',
    start: '2026-11-19',
    end: '2026-11-20',
    time: eventFacts.boothTime,
    place: eventFacts.boothPlace,
  },
  christmas: {
    festival: 'christmas',
    start: '2026-12-08',
    end: '2026-12-09',
    time: eventFacts.boothTime,
    place: eventFacts.boothPlace,
  },
  'cny-valentine': {
    festival: 'cny-valentine',
    start: '2027-02-10',
    end: '2027-02-11',
    time: eventFacts.boothTime,
    place: eventFacts.boothPlace,
  },
};

/**
 * The event, with any saved override applied. Never throws: a database problem
 * shows the defaults rather than a blank booth date. A stored date that is not a
 * real calendar date is ignored for that field, so a bad edit cannot blank a
 * public screen.
 */
export async function getEvent(festival: FestivalId): Promise<EventInfo> {
  const fallback = DEFAULT_EVENTS[festival];
  try {
    const c = await db();
    const r = await c.execute({ sql: 'SELECT * FROM event WHERE festival = ?', args: [festival] });
    const row = r.rows[0];
    if (!row) return fallback;
    const start = String(row.start_date);
    const end = String(row.end_date);
    return {
      festival,
      start: parseIsoDate(start) ? start : fallback.start,
      end: parseIsoDate(end) ? end : fallback.end,
      time: String(row.time_text).trim() || fallback.time,
      place: String(row.place_text).trim() || fallback.place,
    };
  } catch (error) {
    console.error('getEvent: showing the defaults', error);
    return fallback;
  }
}

/** For the admin panel's Events section (phase 5). */
export async function setEvent(event: EventInfo): Promise<void> {
  const c = await db();
  await c.execute({
    sql: `INSERT INTO event (festival, start_date, end_date, time_text, place_text, updated_at)
          VALUES (?, ?, ?, ?, ?, ?)
          ON CONFLICT(festival) DO UPDATE SET
            start_date = excluded.start_date, end_date = excluded.end_date,
            time_text = excluded.time_text, place_text = excluded.place_text,
            updated_at = excluded.updated_at`,
    args: [event.festival, event.start, event.end, event.time, event.place, new Date().toISOString()],
  });
}

/** What every screen shows: the event, already formatted for a Thai reader. */
export interface EventText {
  /** "19–20 พ.ย. 2569" */
  date: string;
  /** "11.10–12.50 น." */
  time: string;
  /** "โถงโรงอาหาร" */
  place: string;
}

export async function getEventText(festival: FestivalId): Promise<EventText> {
  const e = await getEvent(festival);
  return { date: formatDateRange(e.start, e.end), time: e.time, place: e.place };
}
