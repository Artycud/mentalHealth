import type { Metadata } from 'next';
import { connection } from 'next/server';

import { IceCream } from '@/components/booth/art';
import { KeepAwake } from '@/components/booth/KeepAwake';
import { TvControls } from '@/components/booth/TvControls';
import { LoyKrathongHero } from '@/components/festival/loykrathong/Hero';
import { LoyKrathongMoon } from '@/components/festival/loykrathong/Moon';
import { FestivalRiver, FestivalSky } from '@/components/festival/registry';
import { Wordmark } from '@/components/illustrations/icons';
import { tv } from '@/content/th/booth';
import { common } from '@/content/th/common';
import { greeting as g } from '@/content/th/greeting';
import { getEventText } from '@/lib/events';
import { getRewardOn } from '@/lib/settings';

import styles from './greeting.module.css';
import { SceneRotate } from './SceneRotate';

export const metadata: Metadata = { title: 'ยินดีต้อนรับ', robots: { index: false } };

/**
 * /greeting: the TV at the event's entrance, read in a glance from across the
 * room. Two scenes take turns over one night sky and river (the booth TV's): the
 * poster (the event, its date and place, a krathong on the water) and what is on
 * (karaoke, ice cream, the Loy Krathong booth and its ice-cream coupon). No data
 * about anyone, and nothing to touch.
 */
export default async function GreetingPage() {
  // The date, place and the coupon switch are set in the admin panel at any time.
  await connection();
  const [event, rewardOn] = await Promise.all([getEventText('loykrathong'), getRewardOn()]);
  const p = g.poster;

  const poster = (
    <div className={styles.poster}>
      <div className={styles.posterText}>
        <p className={styles.brandSmall}>
          <Wordmark />
          {common.wordmark}
        </p>
        <p className={styles.by}>{p.by}</p>
        <div className={styles.headWrap}>
          <span className={styles.moon} aria-hidden="true">
            <LoyKrathongMoon />
          </span>
          <h1 className={styles.gold}>
            {p.headline.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </h1>
          <p className={styles.sub}>{p.sub}</p>
        </div>
        <p className={styles.quote}>{p.quote}</p>
        <div className={styles.whenBlock}>
          <p className={styles.date}>{event.date}</p>
          <p className={styles.time}>{p.time(event.time)}</p>
          <p className={styles.place}>{p.place(event.place)}</p>
        </div>
      </div>
      <div className={styles.posterArt}>
        <div className={styles.krathong}>
          <LoyKrathongHero />
        </div>
      </div>
      {/* Two small krathongs further off on the water, for depth. */}
      <div className={styles.far} data-far="a">
        <LoyKrathongHero />
      </div>
      <div className={styles.far} data-far="b">
        <LoyKrathongHero />
      </div>
    </div>
  );

  const cards = [
    { key: 'karaoke', art: <Mic />, ...g.items.karaoke },
    { key: 'icecream', art: <IceCream />, ...g.items.icecream },
    { key: 'krathong', art: <LoyKrathongHero />, ...g.items.krathong, sticker: rewardOn },
  ];

  const offers = (
    <div className={styles.offers}>
      {/* The display's moon, up in the corner, lighting the sky. */}
      <span className={styles.offersMoon} aria-hidden="true">
        <LoyKrathongMoon />
      </span>
      <div className={styles.titles}>
        <p className={styles.brand}>
          <Wordmark />
          {common.wordmark}
        </p>
        <h2 className={styles.title}>{g.title}</h2>
      </div>

      <ul className={styles.cards}>
        {cards.map((c, i) => (
          <li key={c.key} className={styles.card} data-card={c.key} style={{ animationDelay: `${-i * 1.3}s` }}>
            <div className={styles.art} data-art={c.key}>
              {c.art}
            </div>
            <h3 className={styles.name}>{c.name}</h3>
            <p className={styles.line}>{c.line}</p>
            {'sticker' in c && c.sticker && (
              <span className={styles.sticker}>
                {g.sticker.top}
                <b>{g.sticker.amount}</b>
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <main className={styles.stage} data-festival="loykrathong">
      <KeepAwake />
      <TvControls label={tv.fullscreen} />
      <div className={styles.sky}>
        <FestivalSky id="loykrathong" lanterns />
      </div>
      <div className={styles.river}>
        <FestivalRiver id="loykrathong" moon={false} />
      </div>
      <SceneRotate scenes={[poster, offers]} />
    </main>
  );
}

/** A microphone in the same cut paper as the ice cream: a riso-blue head, a marigold band, notes. */
function Mic() {
  return (
    <svg viewBox="0 0 220 320" aria-hidden="true">
      <g transform="rotate(-16 110 170)">
        <path d="M92 150 L128 150 L120 300 Q110 312 100 300 Z" fill="var(--ink)" />
        <rect x="80" y="134" width="60" height="26" rx="8" fill="var(--sunflower)" />
        <circle cx="110" cy="92" r="54" fill="var(--riso-blue)" />
        <g stroke="var(--paper)" strokeWidth="3" opacity="0.45" strokeLinecap="round">
          <path d="M70 70 Q110 58 150 70" fill="none" />
          <path d="M60 94 Q110 82 160 94" fill="none" />
          <path d="M68 118 Q110 106 152 118" fill="none" />
          <path d="M92 42 Q86 92 94 142" fill="none" />
          <path d="M128 42 Q134 92 126 142" fill="none" />
        </g>
        <circle cx="90" cy="70" r="10" fill="var(--paper)" opacity="0.7" />
      </g>
      <g fill="var(--riso-pink)">
        <path d="M168 40 L196 32 L196 78" stroke="var(--riso-pink)" strokeWidth="6" fill="none" strokeLinejoin="round" />
        <ellipse cx="186" cy="80" rx="11" ry="8" />
        <path d="M26 150 L26 108 L44 104" stroke="var(--riso-pink)" strokeWidth="6" fill="none" strokeLinejoin="round" />
        <ellipse cx="17" cy="152" rx="10" ry="7.5" />
      </g>
    </svg>
  );
}
