import { Wordmark } from '@/components/illustrations/icons';
import { WallFlower } from '@/components/booth/WallFlower';
import { boothQuizTitle, festivals } from '@/content/th/booth';
import { common, eventFacts } from '@/content/th/common';
import { getWallData } from '@/lib/booth-wall';
import { getActiveFestival } from '@/lib/festival';

import styles from './display.module.css';

/**
 * The booth TV. One of two booth devices: students answer on the kiosk, and
 * this screen — cast to a TV — shows the room what everyone is choosing.
 *
 * Never touched, read from across a canteen, and on for two hours straight.
 * So: no controls, no scrolling, everything sized in vh, and nothing that
 * needs a person to reset it.
 *
 * Anonymous by construction (BRIEF §12). Counts and flowers only, never a name,
 * a class or anything traceable — this is a screen in a room full of people.
 */
export default function BoothDisplayPage() {
  const active = getActiveFestival();
  const theme = active === 'none' ? undefined : festivals[active];
  const wall = getWallData();

  if (!theme?.ready) {
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

  const max = Math.max(...wall.flowers.map((f) => f.count), 1);

  return (
    <main className={styles.stage}>
      <div className={styles.head}>
        <span className={styles.brand}>
          <Wordmark />
          {common.wordmark}
        </span>
        <span className={styles.when}>
          บูธ{theme.name}
          <span className={styles.dot}>·</span>
          {theme.date}
          <span className={styles.dot}>·</span>
          {eventFacts.boothTime}
        </span>
      </div>

      <div className={styles.intro}>
        <p className={styles.note}>{theme.theme}</p>
        <h1 className={styles.title}>{boothQuizTitle}</h1>
      </div>

      <div className={styles.middle}>
        <div className={styles.count}>
          <div className={styles.countNum}>{wall.today}</div>
          <div className={styles.countLabel}>คนเล่นแล้ววันนี้</div>
        </div>

        <div className={styles.bars}>
          {wall.flowers.map((f) => (
            <div key={f.id} className={styles.bar}>
              <span className={styles.barName}>{f.name}</span>
              <span className={styles.barTrack}>
                <span
                  className={styles.barFill}
                  style={{ width: `${Math.round((f.count / max) * 100)}%` }}
                />
              </span>
              <span className={styles.barCount}>{f.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* The river. Each flower is one student's result, floating away —
          ปล่อยวางความทุกข์, the booth's own theme. */}
      <div className={styles.river}>
        <svg className={styles.water} viewBox="0 0 1200 220" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0 150 C150 120 260 180 400 152 C540 124 660 184 800 156 C940 128 1060 176 1200 148" className="ln" />
          <path d="M0 186 C170 158 280 214 430 188 C580 162 700 216 860 190 C1000 168 1080 200 1200 182" className="ln-thin" />
        </svg>
        <div className={styles.floats}>
          {wall.recent.map((r, i) => (
            <span
              key={r.id}
              className={styles.float}
              style={{ animationDelay: `${(i % 5) * 0.4}s` }}
            >
              <WallFlower tint={r.tint} />
            </span>
          ))}
        </div>
      </div>

      <div className={styles.foot}>
        <span>
          {eventFacts.boothPlace} · รวมทั้งหมด {wall.total} คน
        </span>
        {wall.sample && <span className={styles.sample}>ตัวอย่าง — ยังไม่ใช่ข้อมูลจริง</span>}
      </div>
    </main>
  );
}
