import { BoothMarigold, BoothMoon } from '@/components/illustrations/scenes';
import { SecondaryButton, TextLink } from '@/components/ui/buttons';
import { BoothLabelPill, BoothTicket } from '@/components/ui/booth';
import { Screen } from '@/components/ui/Screen';
import { WordmarkHeader } from '@/components/ui/WordmarkHeader';
import { festivals, loykrathongFlowers } from '@/content/th/booth';
import { common, errors } from '@/content/th/common';
import { getEventText } from '@/lib/events';
import { getActiveFestival } from '@/lib/festival';

import styles from './booth.module.css';

/**
 * PHASE 2: the Loy Krathong result screen, static, showing ดาวเรือง. Phase 3
 * puts the 3-question quiz in front of it and maps the answers onto the six
 * flowers (the booth kiosk already does, via flowerFromPoints).
 *
 * With no booth running — or a festival that has no content yet — students see
 * the plain closed state instead (BRIEF §8).
 */
export default function BoothPage() {
  const active = getActiveFestival();
  const theme = active === 'none' ? undefined : festivals[active];

  if (active === 'none' || !theme?.ready || !theme.ticket) {
    return (
      <Screen>
        <WordmarkHeader />
        <h1 className={styles.closedTitle}>{errors.noBooth.title}</h1>
        <p className={styles.closedBody}>{errors.noBooth.body}</p>
      </Screen>
    );
  }

  // Looked up by id, not position: this static screen shows the flower whose
  // copy BRIEF §8 wrote, and the list's order is the council's to change.
  const flower =
    loykrathongFlowers.find((f) => f.id === 'marigold') ?? loykrathongFlowers[0];
  const event = getEventText(active);

  return (
    <div className={styles.page}>
      <BoothMoon className={styles.moon} />

      <Screen>
        <WordmarkHeader />
        <BoothLabelPill>{theme.ticket.label}</BoothLabelPill>

        <p className={styles.note}>{theme.ticket.resultNote}</p>
        <h1 className={styles.flower}>{flower.name}</h1>

        <div className={styles.scene}>
          <BoothMarigold />
        </div>

        <p className={styles.body}>{flower.body}</p>

        <BoothTicket
          title={theme.ticket.title}
          body={theme.ticket.body}
          where={`ที่${event.place} ${event.date}`}
        />

        <div className={styles.actions}>
          <SecondaryButton href="/">{common.actions.home}</SecondaryButton>
          <TextLink href="/checkin">{common.actions.tryCheckin}</TextLink>
        </div>
      </Screen>
    </div>
  );
}
