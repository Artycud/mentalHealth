import { connection } from 'next/server';
import { Fragment } from 'react';

import { IceCream } from '@/components/booth/art';
import { AutoRefresh } from '@/components/booth/AutoRefresh';
import { KeepAwake } from '@/components/booth/KeepAwake';
import { NewFlowerMoment } from '@/components/booth/NewFlowerMoment';
import { QrCode } from '@/components/booth/QrCode';
import { TvControls } from '@/components/booth/TvControls';
import { TvRotate } from '@/components/booth/TvRotate';
import { FestivalRiver, FestivalSky } from '@/components/festival/registry';
import { tintInk, WallFlower } from '@/components/booth/WallFlower';
import { Wordmark } from '@/components/illustrations/icons';
import { festivals, qrInvite, tv } from '@/content/th/booth';
import { common } from '@/content/th/common';
import { demoWallData, getWallData } from '@/lib/booth-wall';
import { getEventText } from '@/lib/events';
import { requireBooth } from '@/lib/guard';
import { riverDepth } from '@/lib/river';
import { getActiveFestival, getRewardOn } from '@/lib/settings';
import { siteUrl } from '@/lib/site-url';

import styles from './display.module.css';

/**
 * The booth TV. One of two booth devices: students answer on the kiosk, and
 * this screen — cast to a TV — shows the room what everyone is choosing.
 *
 * Never touched, read from across a canteen, and on for two hours straight.
 * So: no controls, no scrolling, everything sized in vh, and nothing that
 * needs a person to reset it. It also has to look alive on its own, which is
 * why the water moves and the flowers drift: a screen that never changes reads
 * as frozen from across a room.
 *
 * Anonymous by construction (BRIEF §12). Counts and flowers only, never a name,
 * a class or anything traceable — this is a screen in a room full of people.
 *
 * It also carries the booth's one idea, that looking okay and being okay are not
 * the same thing and both are normal: the flower bars take turns with awareness
 * slides (the guarded "n in 10" from the honest question, and plain lines, a few
 * with sources), and a QR code invites students to the main site for the deeper
 * questions later, in their own time.
 */
export default async function BoothDisplayPage(props: PageProps<'/booth/display'>) {
  // Which booth is live, and when it runs, can change at any moment from the admin
  // panel, so this page is built per request and never prerendered. (`connection`
  // is how Next.js says so; the database read below does not, by itself.)
  await connection();
  await requireBooth('/booth/display');
  const active = await getActiveFestival();
  const theme = active === 'none' ? undefined : festivals[active];

  if (active === 'none' || !theme?.ready) {
    return (
      <main className={styles.stage}>
        <div className={styles.head}>
          <span className={styles.brand}>
            <Wordmark />
            {common.wordmark}
          </span>
        </div>
        <div className={styles.intro}>
          <h1 className={styles.title}>ยังไม่มีบูธตอนนี้</h1>
        </div>
      </main>
    );
  }

  // `?demo=1` shows invented numbers so the design can be reviewed before there is
  // any real data. It works only outside production: on the real TV the query is
  // ignored, so nobody can put made-up figures on the wall.
  const { demo } = await props.searchParams;
  const showDemo = demo === '1' && process.env.NODE_ENV !== 'production';

  const [wall, event, qrUrl, rewardOn] = await Promise.all([
    showDemo ? demoWallData() : getWallData(active),
    getEventText(active),
    siteUrl('/'),
    getRewardOn(),
  ]);
  const max = Math.max(...wall.flowers.map((f) => f.count), 1);

  const empty = wall.recent.length === 0;

  // The hook: the reward when there is one and it has not run out, else the flower.
  const reward = rewardOn ? theme.reward : undefined;
  const hook = reward ?? tv.hook.flowerOnly;

  // The flower bars: the stats panel's main view, taking turns with the awareness slides.
  const bars = (
    <div className={styles.bars}>
      {wall.flowers.map((f, i) => (
        <div key={f.id} className={styles.bar}>
          <span className={styles.barName}>{f.name}</span>
          <span className={styles.barFlower}>
            {/* On a plate: petals multiplied straight onto the night sky would go dark. */}
            <WallFlower tint={f.tint} plate />
          </span>
          <span className={styles.barTrack}>
            {/* Each bar takes its flower's own ink, so the chart and the river
                below speak the same colours. --r is how much of the track is
                left empty; the fill is clipped to it, not resized, so its
                rounded end is never squashed. */}
            <span
              className={styles.barFill}
              style={
                {
                  '--ink-bar': tintInk(f.tint),
                  '--r': `${100 - Math.round((f.count / max) * 100)}%`,
                  animationDelay: `${i * 90}ms`,
                } as React.CSSProperties
              }
            />
          </span>
          <span className={styles.barCount}>{f.count}</span>
        </div>
      ))}
    </div>
  );

  // The awareness slides. The "n in 10" appears only once the guard in
  // lib/booth-wall.ts allows it, and then between every plain line, so it is the
  // one the room sees most. A share that rounds to none is not shown at all.
  const a = tv.awareness;
  const lines = a.lines.map((line) => (
    <div key={line.text} className={styles.aware}>
      <p className={styles.awareNote}>{a.note}</p>
      <p className={styles.awareText}>{line.text}</p>
      {line.source && <p className={styles.awareSource}>ที่มา: {line.source}</p>}
    </div>
  ));
  const okay = wall.okay && wall.okay.inTen > 0 ? wall.okay : null;
  const stat = okay && (
    <div className={styles.aware}>
      <p className={styles.awareNote}>{a.note}</p>
      <p className={styles.people} aria-hidden="true">
        {Array.from({ length: 10 }, (_, i) => (
          <span key={i} className={`${styles.person} ${i < okay.inTen ? styles.personOn : ''}`} />
        ))}
      </p>
      <p className={styles.awareStat}>{a.stat(okay.inTen)}</p>
      <p className={styles.awareText}>{a.statLine}</p>
      <p className={styles.awareTail}>{a.statTail}</p>
    </div>
  );
  const awareness = stat ? lines.flatMap((line, i) => [<div key={`s${i}`}>{stat}</div>, line]) : lines;

  // The river shows the same flowers twice, end to end, and slides by exactly
  // one copy — so the loop has no seam. Each copy is at least a screen wide.
  const river = [0, 1];

  return (
    <main className={styles.stage} data-festival={active}>
      {/* Polls the server so the numbers stay current, never into an error page. */}
      <AutoRefresh />
      <KeepAwake />
      <TvControls label={tv.fullscreen} />
      {/* The festival's sky texture, behind everything. The count is the moon, and
          the TV has its own lanterns, so the sky draws neither. */}
      <div className={styles.sky}>
        <FestivalSky id={active} />
      </div>
      {/* Lanterns rising off the water, behind everything: the night is alive. */}
      <div className={styles.lanterns} aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
      </div>
      <div className={styles.head}>
        <span className={styles.brand}>
          <Wordmark />
          {common.wordmark}
          {/* Only when the numbers are real: a pulsing "live" beside made-up data
              would be a lie. */}
          {!wall.sample && (
            <span className={styles.live}>
              <span className={styles.liveDot} />
              สด
            </span>
          )}
        </span>
        <span className={styles.when}>
          บูธ{theme.name}
          <span className={styles.dot}>·</span>
          {event.date}
          <span className={styles.dot}>·</span>
          {event.time}
        </span>
      </div>

      <div className={styles.top}>
        {/* The hook: one line, read in a glance. Never covered, not even by a new
            flower. */}
        <section className={styles.hook} data-hook={reward ? 'reward' : 'flower'}>
          <div className={styles.hookText}>
            <p className={styles.lead}>{hook.lead}</p>
            <h1 className={styles.headline}>
              {hook.headline} <span className={styles.amount}>{hook.amount}</span>
            </h1>
            <p className={styles.extra}>{hook.extra}</p>
          </div>
          <div className={styles.hookArt}>
            {reward ? <IceCream /> : <WallFlower tint={wall.flowers[0]?.tint ?? 0} plate size={240} />}
          </div>
        </section>

        {/* The bridge to the main site, for later. Dark glass around it so it does
            not outshine the stats; white only behind the code, for the camera. */}
        <aside className={styles.qrCard}>
          <span className={styles.qrTitle}>
            <Phrases text={qrInvite.title} />
          </span>
          <div className={styles.qrBox}>
            <QrCode value={qrUrl} label={qrInvite.title} />
          </div>
          <span className={styles.qrBody}>
            <Phrases text={qrInvite.body} />
          </span>
        </aside>

        {/* The stats, big: how many have played today, on the moon, and which
            flowers. The bars take turns with the awareness slides, and a new
            flower plays over that panel only. */}
        <div className={styles.stats}>
          <div className={styles.count}>
            <div className={styles.moon}>
              <span className={styles.countNum}>{wall.today}</span>
            </div>
            <p className={styles.countLabel}>{tv.hook.countLabel}</p>
          </div>
          <div className={styles.panel}>
            <TvRotate primary={bars} items={awareness} />
            {/* In demo mode it pretends one arrives every few seconds, so the
                design can be reviewed. */}
            <NewFlowerMoment total={wall.total} recent={wall.recent} demo={showDemo} />
          </div>
        </div>
      </div>

      {/* The river band. The water is the festival's (an empty slot if it has none);
          the flowers on it are the base's: each one is a student's result, floating
          away. ปล่อยวางความทุกข์, the booth's own theme. The moon is up in the sky
          holding the count, so the river draws none of its own; its far bank stands
          on the right, under the QR card. */}
      <div className={styles.river}>
        <FestivalRiver id={active} moon={false} bank />
        {empty && <p className={styles.emptyRiver}>{tv.empty}</p>}
        <div className={styles.track}>
          {river.map((copy) => (
            <div key={copy} className={styles.set} aria-hidden={copy === 1}>
              {wall.recent.map((r, i) => (
                <span
                  key={`${copy}-${i}-${r.tint}`}
                  className={styles.float}
                  style={
                    {
                      // Newest is nearest and biggest; older ones recede.
                      '--depth': riverDepth(i),
                      animationDelay: `${-(i % 5) * 0.8}s`,
                    } as React.CSSProperties
                  }
                >
                  <WallFlower tint={r.tint} plate />
                </span>
              ))}
            </div>
          ))}
        </div>
        <div className={styles.foot}>
          <span>
            {event.place} · {theme.theme} · รวมทั้งหมด {wall.total} คน
          </span>
          {wall.sample && <span className={styles.sample}>ตัวอย่าง — ยังไม่ใช่ข้อมูลจริง</span>}
        </div>
      </div>
    </main>
  );
}

/**
 * Thai has no spaces between words, so a browser breaks a line wherever its
 * dictionary finds a word boundary, and in a narrow card that splits phrases like
 * "เช็ก|ใจ". The copy already has spaces between its phrases, so this wraps only
 * there. A space before ๆ is part of the word, never a place to break.
 */
function Phrases({ text }: { text: string }) {
  // The space between phrases sits outside them: a space at the end of a no-wrap
  // box is dropped, and the words would run together.
  return text.split(/ (?!ๆ)/).map((part, i) => (
    <Fragment key={i}>
      {i > 0 && ' '}
      <span className={styles.phrase}>{part}</span>
    </Fragment>
  ));
}
