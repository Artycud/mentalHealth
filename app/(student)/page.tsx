import type { Viewport } from 'next';
import { connection } from 'next/server';

import { Landing, type Round } from '@/components/landing/Landing';
import { festivalOrder, festivals } from '@/content/th/booth';
import { placeholders } from '@/content/th/common';
import { greetingFor } from '@/content/th/heart';
import { getEvent } from '@/lib/events';
import { formatDateRange } from '@/lib/thai-date';

export const viewport: Viewport = { themeColor: '#FFF8FA', colorScheme: 'light' };

/** Today in Bangkok, as YYYY-MM-DD. */
function bangkokToday(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok' }).format(new Date());
}

/** The hour in Bangkok, for the small greeting above the check-up button. */
function bangkokHour(): number {
  return Number(new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Bangkok', hour: '2-digit', hourCycle: 'h23' }).format(new Date()));
}

const dayNumber = (iso: string) => Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10)) / 86_400_000;

/**
 * User Mode home: the event's front door. It asks nothing; it tells the student
 * what the week is and when the next round is. Dates come from lib/events.ts,
 * so an edit in the admin panel shows here on the next load.
 */
export default async function HomePage() {
  await connection();
  const today = bangkokToday();
  let nextFound = false;

  const rounds: Round[] = [];
  for (const id of festivalOrder) {
    const e = await getEvent(id);
    let state: Round['state'] = 'later';
    let inDays: number | undefined;
    if (e.end < today) state = 'past';
    else if (e.start <= today) state = 'today';
    else if (!nextFound) {
      state = 'next';
      inDays = dayNumber(e.start) - dayNumber(today);
    }
    if (state === 'today' || state === 'next') nextFound = true;
    rounds.push({
      id,
      name: festivals[id].name,
      date: formatDateRange(e.start, e.end),
      time: e.time,
      place: e.place,
      state,
      inDays,
    });
  }

  return (
    <main data-home="heart">
      <Landing rounds={rounds} careHref={placeholders.cudCareHref} greeting={greetingFor(bangkokHour())} />
    </main>
  );
}
