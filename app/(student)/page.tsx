import { HomeScene } from '@/components/illustrations/scenes';
import { PrimaryButton } from '@/components/ui/buttons';
import { CudCareBlock } from '@/components/ui/CudCareBlock';
import { FestivalSection } from '@/components/ui/FestivalSection';
import { Screen } from '@/components/ui/Screen';
import { WordmarkHeader } from '@/components/ui/WordmarkHeader';
import { festivalOrder, festivals } from '@/content/th/booth';
import { common, home } from '@/content/th/common';
import { getEventText } from '@/lib/events';
import { getActiveFestival } from '@/lib/festival';

import styles from './home.module.css';

/** Keep it this short: the student came from a QR code, so get them in (BRIEF §8). */
export default function HomePage() {
  const active = getActiveFestival();
  const theme = active === 'none' ? undefined : festivals[active];

  // A festival with no content yet shows only the next-booth pills (§8).
  const live =
    active !== 'none' && theme?.ready && theme.home
      ? {
          name: theme.name,
          blurb: theme.home.blurb,
          date: getEventText(active).date,
          playLabel: common.actions.playBooth,
          href: '/booth',
        }
      : undefined;

  // "Next" means later in the running order; with no booth live, all of them.
  const activeIndex = active === 'none' ? -1 : festivalOrder.indexOf(active);
  const upcoming = festivalOrder.slice(activeIndex + 1).map((id) => festivals[id].name);

  return (
    <Screen>
      <WordmarkHeader />

      <div className={styles.scene}>
        <HomeScene />
      </div>

      <div className={styles.intro}>
        <h1 className={styles.headline}>{home.headline}</h1>
        <p className={styles.lead}>{home.body}</p>
        <div className={styles.cta}>
          <PrimaryButton href="/checkin">{common.actions.startCheckin}</PrimaryButton>
        </div>
      </div>

      <FestivalSection live={live} upcoming={upcoming} />
      <CudCareBlock variant="home" />

      <p className={styles.privacy}>{common.privacyNote}</p>
      <footer className={styles.footer}>{common.footer}</footer>
    </Screen>
  );
}
