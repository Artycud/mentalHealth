import Link from 'next/link';

import { heart } from '@/content/th/heart';
import { landing, roundDetail } from '@/content/th/landing';
import type { FestivalId } from '@/lib/types';

import { BoothArt, FoodArt, MusicArt } from './art';
import { DriftingHearts } from './DriftingHearts';
import { HeartInvite } from './HeartInvite';
import { MorePanels } from './MorePanels';
import styles from './Landing.module.css';

export interface Round {
  id: FestivalId;
  name: string;
  date: string;
  time: string;
  place: string;
  state: 'past' | 'today' | 'next' | 'later';
  /** Days until it starts; only for the next one. */
  inDays?: number;
}

const ART = { music: MusicArt, food: FoodArt, booth: BoothArt } as const;

/**
 * The User Mode home: the event's front door. What the week is, then one living
 * heart to touch (the check-up), then MBTI and VENT as panels of their own, what
 * every round has, and when the rounds are (only what each is about: what happens
 * at them stays a surprise).
 */
export function Landing({
  rounds,
  careHref,
  greeting,
}: {
  rounds: Round[];
  careHref: string;
  /** A small hello for the time of day, from content/th/heart.ts. */
  greeting: string;
}) {
  return (
    <div className={styles.root}>
      <div className={styles.sky} aria-hidden="true" />
      <div className={styles.grain} aria-hidden="true" />

      {/* ---------- hero ---------- */}
      <section className={styles.hero}>

        <div className={styles.heroText}>
          <p className={styles.kicker}>{landing.hero.kicker}</p>
          <h1 className={styles.title}>{landing.hero.title}</h1>
          <p className={styles.lead}>{landing.hero.body}</p>
        </div>

        {/* The one thing to do now. Light on purpose: a look, not a test. Everyone's
            hearts drift around it, peeking out from behind. */}
        <div className={styles.invite}>
          <DriftingHearts className={styles.hearts} />
          <HeartInvite greeting={greeting} copy={landing.hero.check} />
        </div>

        <p className={styles.scroll} aria-hidden="true">
          {landing.hero.scroll}
          <span className={styles.scrollLine} />
        </p>
      </section>

      {/* ---------- MBTI and VENT, whenever ---------- */}
      <section className={styles.section} style={{ paddingTop: 8 }}>
        <MorePanels mbti={landing.more.mbti} vent={landing.more.vent} samples={heart.ways.vent.samples} />
      </section>

      {/* ---------- every round ---------- */}
      <section className={styles.section}>
        <p className={styles.note}>{landing.every.note}</p>
        <ul className={styles.every}>
          {landing.every.items.map((item) => {
            const Art = ART[item.id];
            return (
              <li key={item.id} className={styles.everyItem} data-item={item.id}>
                <Art />
                <div>
                  <h2 className={styles.everyTitle}>{item.title}</h2>
                  <p className={styles.everyBody}>{item.body}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {/* ---------- the three rounds ---------- */}
      <section id="rounds" className={styles.section}>
        <p className={styles.note}>{landing.rounds.note}</p>
        <h2 className={styles.sectionTitle}>{landing.rounds.title}</h2>

        <ol className={styles.timeline}>
          {rounds.map((r) => (
            <li key={r.id} className={styles.round} data-state={r.state} data-round={r.id}>
              <span className={styles.node} aria-hidden="true" />
              <div className={styles.roundHead}>
                <p className={styles.roundDate}>{r.date}</p>
                {r.state === 'today' && <span className={styles.tag}>{landing.rounds.now}</span>}
                {r.state === 'next' && (
                  <span className={styles.tag}>
                    {landing.rounds.next} · {landing.rounds.inDays(r.inDays ?? 0)}
                  </span>
                )}
                {r.state === 'past' && <span className={styles.tagPast}>{landing.rounds.past}</span>}
              </div>
              <h3 className={styles.roundName}>{r.name}</h3>
              <p className={styles.roundTheme}>{roundDetail[r.id].theme}</p>
              <p className={styles.roundWhere}>
                {r.place} · {r.time}
              </p>
            </li>
          ))}
        </ol>
      </section>

      {/* ---------- CUD Care ---------- */}
      <section className={styles.care}>
        <svg width="64" height="40" viewBox="0 0 64 40" aria-hidden="true">
          <circle cx="22" cy="20" r="17" fill="#6FD7B8" />
          <circle cx="42" cy="20" r="17" fill="#F0588A" style={{ mixBlendMode: 'multiply' }} />
        </svg>
        <h2 className={styles.careTitle}>{landing.care.title}</h2>
        <p className={styles.careBody}>{landing.care.body}</p>
        <Link href={careHref} className={styles.careLink}>
          {landing.care.link}
        </Link>
      </section>

      <footer className={styles.footer}>
        <p>{landing.footer.where}</p>
        <p className={styles.council}>{landing.footer.council}</p>
      </footer>
    </div>
  );
}
