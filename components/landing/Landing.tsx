import Link from 'next/link';

import { Live } from '@/components/heart/Live';
import palette from '@/components/heart/palette.module.css';
import { heart } from '@/content/th/heart';
import { landing, roundDetail } from '@/content/th/landing';
import type { FestivalId } from '@/lib/types';

import { BoothArt, FoodArt, MusicArt } from './art';
import { HeartInvite } from './HeartInvite';
import { IntroStory } from './IntroStory';
import { MorePanels } from './MorePanels';
import { RoundsCarousel } from './RoundsCarousel';
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

/** What the little tag on a round says, if anything. */
function tagFor(r: Round): string | undefined {
  if (r.state === 'today') return landing.rounds.now;
  if (r.state === 'next') return `${landing.rounds.next} · ${landing.rounds.inDays(r.inDays ?? 0)}`;
  if (r.state === 'past') return landing.rounds.past;
  return undefined;
}

/**
 * The User Mode home: a one-page scroll intro that turns into the check-up (one
 * living heart to touch, framed by everyone's); then "อยากไปต่อ": VENT, CUD Care
 * as the human option, MBTI; then the event itself: what the week is, what
 * every round has, and when the rounds are (only what each is about: what
 * happens at them stays a surprise), with the place and time said once.
 *
 * The page frame (sky, palette, press feedback, page slides) is
 * components/heart/UserPage. Only the check-up card is rose: it is the one
 * thing the home asks for. Everything else is soft pastel paper.
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
      {/* ---------- a one-page scroll intro, then the home ---------- */}
      <IntroStory kicker={landing.intro.kicker} line={landing.intro.line} cue={landing.intro.cue} />

      {/* ---------- the check-up: rises into the lower half of the intro's screen ---------- */}
      <section className={styles.check}>
        <HeartInvite greeting={greeting} copy={landing.hero.check} />
      </section>

      {/* ---------- อยากไปต่อ: VENT, a person, MBTI ---------- */}
      <section className={styles.section}>
        <p className={styles.note}>{landing.onward}</p>
        <MorePanels
          mbti={landing.more.mbti}
          vent={landing.more.vent}
          samples={heart.ways.vent.samples}
          between={
            <div className={styles.care}>
              <svg width="52" height="32" viewBox="0 0 64 40" aria-hidden="true">
                <circle cx="22" cy="20" r="17" fill="#6FD7B8" />
                <circle cx="42" cy="20" r="17" fill="#FF8FB5" style={{ mixBlendMode: 'multiply' }} />
              </svg>
              <h2 className={styles.careTitle}>{landing.care.title}</h2>
              <p className={styles.careBody}>{landing.care.body}</p>
              <Link href={careHref} className={`${palette.pill} ${styles.careLink}`} data-press>
                {landing.care.link}
              </Link>
            </div>
          }
        />
      </section>

      {/* ---------- the event ---------- */}
      <section className={`${styles.section} ${styles.later}`}>
        <p className={styles.kicker}>{landing.hero.kicker}</p>
        <h2 className={styles.title}>
          <span className={styles.underlined}>
            {landing.hero.title}
            <svg className={styles.squiggle} viewBox="0 0 200 14" preserveAspectRatio="none" aria-hidden="true">
              <path d="M3 9 C 22 2, 38 13, 58 7 S 96 2, 118 8 S 160 13, 197 5" fill="none" stroke="#FFC94D" strokeWidth="5" strokeLinecap="round" />
            </svg>
          </span>
        </h2>
        <p className={styles.lead}>{landing.hero.body}</p>
      </section>

      {/* ---------- every round ---------- */}
      <section className={`${styles.section} ${styles.later}`}>
        <p className={styles.note}>{landing.every.note}</p>
        <Live>
          <ul className={styles.every}>
            {landing.every.items.map((item) => {
              const Art = ART[item.id];
              return (
                <li key={item.id} className={styles.everyItem} data-item={item.id}>
                  <Art />
                  <div>
                    <h3 className={styles.everyTitle}>{item.title}</h3>
                    <p className={styles.everyBody}>{item.body}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </Live>
      </section>

      {/* ---------- the three rounds ---------- */}
      <section id="rounds" className={`${styles.section} ${styles.later}`}>
        <p className={styles.note}>{landing.rounds.note}</p>
        <h2 className={styles.sectionTitle}>{landing.rounds.title}</h2>
        {rounds[0] && <p className={styles.sectionBody}>{landing.rounds.where(rounds[0].place, rounds[0].time)}</p>}
        <RoundsCarousel
          label={landing.rounds.label}
          rounds={rounds.map((r) => ({
            id: r.id,
            name: r.name,
            date: r.date,
            theme: roundDetail[r.id].theme,
            state: r.state,
            tag: tagFor(r),
          }))}
        />
      </section>

      <footer className={styles.footer}>
        <p className={styles.council}>{landing.footer.council}</p>
      </footer>
    </div>
  );
}
