import { connection } from 'next/server';

import { StatusScreen } from '@/components/ui/StatusScreen';
import { festivals } from '@/content/th/booth';
import { errors } from '@/content/th/common';
import { getEventText } from '@/lib/events';
import { getActiveFestival } from '@/lib/settings';

import { BoothPhone } from './BoothPhone';

/**
 * The booth quiz on a student's phone. With no booth running, or a festival that
 * has no content yet, students see the plain closed state instead (BRIEF §8).
 */
export default async function BoothPage() {
  // Which booth is live, and when it runs, can change at any moment from the admin
  // panel, so this page is built per request and never prerendered. (`connection`
  // is how Next.js says so; the database read below does not, by itself.)
  await connection();
  const active = await getActiveFestival();
  const theme = active === 'none' ? undefined : festivals[active];

  if (active === 'none' || !theme?.ready || !theme.ticket) {
    return (
      <StatusScreen
        title={errors.noBooth.title}
        body={errors.noBooth.body}
        action={{ label: errors.noBooth.action, href: '/' }}
      />
    );
  }

  const event = await getEventText(active);

  return (
    <BoothPhone
      festival={theme.id}
      label={theme.ticket.label}
      resultNote={theme.ticket.resultNote}
      ticketTitle={theme.ticket.title}
      where={`ที่${event.place} ${event.date}`}
    />
  );
}
