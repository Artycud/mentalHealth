import { connection } from 'next/server';

import { CountBlob } from '@/components/booth/art';
import { AutoRefresh } from '@/components/booth/AutoRefresh';
import { NewFlowerMoment } from '@/components/booth/NewFlowerMoment';
import { FestivalRiver } from '@/components/festival/registry';
import { tintInk, WallFlower } from '@/components/booth/WallFlower';
import { Wordmark } from '@/components/illustrations/icons';
import { boothQuizTitle, festivals, tv } from '@/content/th/booth';
import { common } from '@/content/th/common';
import { demoWallData, getWallData } from '@/lib/booth-wall';
import { getEventText } from '@/lib/events';
import { requireBooth } from '@/lib/guard';
import { riverDepth } from '@/lib/river';
import { getActiveFestival } from '@/lib/settings';

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

  const wall = showDemo ? demoWallData() : await getWallData(active);
  const event = await getEventText(active);
  const max = Math.max(...wall.flowers.map((f) => f.count), 1);

  const empty = wall.recent.length === 0;

  // The river shows the same flowers twice, end to end, and slides by exactly
  // one copy — so the loop has no seam. Each copy is at least a screen wide.
  const river = [0, 1];

  return (
    <main className={styles.stage} data-festival={active}>
      {/* Polls the server so the numbers stay current. */}
      <AutoRefresh />
      {/* A quiet screen for each new flower. In demo mode it pretends one arrives
          every few seconds, so the design can be reviewed. */}
      <NewFlowerMoment total={wall.total} recent={wall.recent} demo={showDemo} />
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

      <div className={styles.intro}>
        <p className={styles.note}>{theme.theme}</p>
        <h1 className={styles.title}>{boothQuizTitle}</h1>
      </div>

      <div className={styles.middle}>
        <div className={styles.count}>
          <div className={styles.countArt}>
            <div className={styles.layer}>
              <CountBlob />
            </div>
            <div className={styles.countNum}>{wall.today}</div>
          </div>
          <div className={styles.countLabel}>คนเล่นแล้ววันนี้</div>
        </div>

        <div className={styles.bars}>
          {wall.flowers.map((f, i) => (
            <div key={f.id} className={styles.bar}>
              <span className={styles.barName}>{f.name}</span>
              <span className={styles.barFlower}>
                <WallFlower tint={f.tint} />
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
      </div>

      {/* The river band. The water is the festival's (an empty slot if it has none);
          the flowers on it are the base's: each one is a student's result, floating
          away. ปล่อยวางความทุกข์, the booth's own theme. Text on the water is paper
          coloured, so the footer lives inside the band. */}
      <div className={styles.river}>
        <FestivalRiver id={active} />
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
            {event.place} · รวมทั้งหมด {wall.total} คน
          </span>
          {wall.sample && <span className={styles.sample}>ตัวอย่าง — ยังไม่ใช่ข้อมูลจริง</span>}
        </div>
      </div>
    </main>
  );
}
