import Link from 'next/link';

import { Live } from '@/components/heart/Live';
import palette from '@/components/heart/palette.module.css';
import { landing, roundDetail } from '@/content/th/landing';
import type { FestivalId } from '@/lib/types';

import { BoothArt, FoodArt, MusicArt } from './art';
import { HeartInvite } from './HeartInvite';
import { IntroStory } from './IntroStory';
import { MorePanels } from './MorePanels';
import { RoundsCarousel } from './RoundsCarousel';
import { VentStart } from './VentStart';
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

/** The navy "go" disc at the end of a slip; `small` on the quiet one. */
function GoMark({ small = false }: { small?: boolean }) {
  return (
    <span className={small ? `${palette.go} ${styles.goSmall}` : palette.go} aria-hidden="true">
      <svg width={small ? 16 : 20} height={small ? 16 : 20} viewBox="0 0 22 22">
        <path d="M7 4 L15 11 L7 18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

/**
 * The User Mode home: a moment of one question on the sky, then (by itself) the
 * first screen: the question as the headline, and under it the ways in, as
 * slips: ระบายให้พี่สภาฟัง first (the home's main way in: a person answers),
 * then the check-up (one living heart to touch), and CUD Care as the human option. Then "อยากไปต่อ": MBTI; then the event itself: what the week is, what
 * every round has, and when the rounds are (only what each is about: what
 * happens at them stays a surprise), with the place and time said once.
 *
 * The page frame (sky, palette, press feedback, page slides) is
 * components/heart/UserPage. The top is slips taped to the time-of-day sky, the
 * check-up the one marigold slip (the one thing the home asks for); the event
 * below is printed on one sheet of paper.
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
      {/* ---------- the opening scene, then by itself the home's first screen:
           the question, and the three ways in under it ---------- */}
      <IntroStory kicker={landing.intro.kicker} line={landing.intro.line}>
        {/* ระบายให้พี่สภาฟัง comes first, the home's main way in: a bar to start
            writing in, and Enter opens the chat with it sent. */}
        <div className={styles.taped}>
          <VentStart />
        </div>

        {/* The check-up, the other way in. */}
        <p className={styles.or}>{landing.or}</p>

        <div className={styles.taped}>
          <HeartInvite greeting={greeting} copy={landing.hero.check} />
        </div>

        <MorePanels mbti={landing.more.mbti} />
      </IntroStory>

      {/* ---------- อยากไปต่อ: a person, always one tap away and never pushed ---------- */}
      <section className={styles.section}>
        <p className={styles.note}>{landing.onward}</p>
        <Link href={careHref} className={`${palette.card} ${styles.slip}`} data-slip="care" data-press>
          <svg className={styles.careMark} width="34" height="22" viewBox="0 0 64 40" aria-hidden="true">
            <circle cx="22" cy="20" r="17" fill="#0078BF" />
            <circle cx="42" cy="20" r="17" fill="#FF48B0" style={{ mixBlendMode: 'multiply' }} />
          </svg>
          <span className={styles.slipWords}>
            <span className={styles.slipTitle}>{landing.care.title}</span>
            <span className={styles.slipFoot}>{landing.care.body}</span>
          </span>
          <GoMark small />
        </Link>
      </section>

      {/* ---------- below the sky: the event, printed on one sheet of paper ---------- */}
      <div className={styles.sheet}>
        {/* ---------- the event ---------- */}
        <section className={`${styles.section} ${styles.later}`}>
          <p className={styles.kicker}>{landing.hero.kicker}</p>
          <h2 className={styles.title}>
            <span className={styles.underlined}>{landing.hero.title}</span>
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
    </div>
  );
}
