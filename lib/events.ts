import { eventFacts } from '@/content/th/common';

import { formatDateRange } from './thai-date';
import type { FestivalId } from './types';

/**
 * When and where each booth runs.
 *
 * This is the one place that answers "when is the booth". The home page, the
 * kiosk, the TV and the booth ticket all read it, so changing a date here
 * changes it everywhere.
 *
 * The values below are DEFAULTS from the approved project document. The admin
 * panel's กิจกรรม (Events) section will let the council change them without a
 * deploy — dates move, and this project already met one document that disagreed
 * with itself about two of them (see BRIEF.md). `getEvent` is the seam: phase 4
 * makes it read the `event` table and fall back to these defaults for any
 * festival with no row, so a fresh database still shows sensible dates.
 *
 * Dates are ISO calendar dates, formatted for display by lib/thai-date.ts.
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
 * TODO(phase 4): overlay the `event` row for this festival, if there is one.
 *
 * WHEN THIS STARTS READING THE DATABASE, every page that calls it (home, booth,
 * kiosk, TV) must render per request. Today `next build` prerenders them all as
 * static, which is fine while the dates are constants but would freeze an admin's
 * edit until the next rebuild. Mark those routes dynamic in the same change.
 */
export function getEvent(festival: FestivalId): EventInfo {
  return DEFAULT_EVENTS[festival];
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

export function getEventText(festival: FestivalId): EventText {
  const e = getEvent(festival);
  return { date: formatDateRange(e.start, e.end), time: e.time, place: e.place };
}
