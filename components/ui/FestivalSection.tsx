import { FestivalIcon } from '@/components/festival/registry';
import { home } from '@/content/th/common';
import type { FestivalId } from '@/lib/types';

import { PillLink } from './buttons';
import styles from './FestivalSection.module.css';

interface FestivalSectionProps {
  /** The live booth. Omitted when none is running, leaving only the next-booth row. */
  live?: {
    /** Which festival, so it can draw its own small mark. */
    id: FestivalId;
    name: string;
    blurb: string;
    date: string;
    playLabel: string;
    href: string;
  };
  /** Thai names of the booths still to come. */
  upcoming: string[];
}

export function FestivalSection({ live, upcoming }: FestivalSectionProps) {
  return (
    <section className={styles.section}>
      {live && (
        <>
          <div className={styles.head}>
            <div className={styles.titles}>
              <span className={styles.note}>{home.festivalNote}</span>
              <h2 className={styles.title}>{live.name}</h2>
            </div>
            <FestivalIcon id={live.id} />
          </div>
          <p className={styles.body}>{live.blurb}</p>
          <p className={styles.date}>{live.date}</p>
          <div className={styles.cta}>
            <PillLink href={live.href}>{live.playLabel}</PillLink>
          </div>
        </>
      )}

      {upcoming.length > 0 && (
        <div className={styles.next}>
          <span className={styles.nextLabel}>{home.nextBoothLabel}</span>
          {upcoming.map((name) => (
            <span key={name} className={styles.chip}>
              {name}
            </span>
          ))}
        </div>
      )}
    </section>
  );
}
