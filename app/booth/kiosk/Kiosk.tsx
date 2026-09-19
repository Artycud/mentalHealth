'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { ChoiceMark } from '@/components/booth/ChoiceMark';
import { WallFlower } from '@/components/booth/WallFlower';
import { BackChevron, SuggestionMarker, Wordmark } from '@/components/illustrations/icons';
import { BoothMarigold } from '@/components/illustrations/scenes';
import {
  boothNext,
  boothQuizTitle,
  flowerFromPoints,
  kiosk,
  loykrathongQuiz,
  withDok,
  type FestivalTheme,
} from '@/content/th/booth';
import { common } from '@/content/th/common';
import type { EventText } from '@/lib/events';

import styles from './kiosk.module.css';

/** A riso "+" mark: two thin strokes, as in the scene illustrations (§6). */
function Sparkle({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 14 14" aria-hidden="true" className={className}>
      <path d="M7 1 L7 13 M1 7 L13 7" className="ln-thin" />
    </svg>
  );
}

type Stage =
  | { kind: 'idle' }
  | { kind: 'quiz'; step: number; points: number[] }
  | { kind: 'result'; points: number[] };

/**
 * The booth kiosk. Runs unattended on an iPad or laptop for two hours while a
 * queue of students uses it one after another.
 *
 * Two things follow from that, and drive the whole component:
 *  - It must always return to a clean start. The result auto-resets after
 *    kiosk.resetSeconds of no touching, so a student who walks off does not
 *    leave their answer on screen for the next person — which is also a privacy
 *    point (§12). Any touch restarts the count, so a student still reading is
 *    never cut off.
 *  - Nothing persists in the browser between students. State lives in memory
 *    only, and the session write in phase 4 is anonymous like every other.
 */
export function Kiosk({ theme, event }: { theme: FestivalTheme; event: EventText }) {
  const [stage, setStage] = useState<Stage>({ kind: 'idle' });
  const [remaining, setRemaining] = useState<number>(kiosk.resetSeconds);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const reset = useCallback(() => setStage({ kind: 'idle' }), []);

  /** Entering the result also arms the countdown, so the effect below only ever
   *  runs the timer. Resetting `remaining` inside the effect instead would set
   *  state during render and cascade an extra render every time. */
  const finish = useCallback((points: number[]) => {
    setRemaining(kiosk.resetSeconds);
    setStage({ kind: 'result', points });
  }, []);

  // Auto-reset the result for the next student in the queue.
  useEffect(() => {
    if (stage.kind !== 'result') return;
    const tick = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(tick);
          reset();
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, [stage.kind, reset]);

  // Focus follows the question, so a keyboard or screen reader keeps up (§9).
  const step = stage.kind === 'quiz' ? stage.step : -1;
  useEffect(() => {
    if (step >= 0) headingRef.current?.focus({ preventScroll: true });
  }, [step]);

  const head = (
    <div className={styles.head}>
      <span className={styles.brand}>
        <Wordmark />
        {common.wordmark}
      </span>
      {stage.kind === 'quiz' && (
        <span className={styles.progress}>
          <button
            type="button"
            className={styles.back}
            aria-label={kiosk.back}
            onClick={() =>
              stage.step === 0
                ? reset()
                : setStage({ kind: 'quiz', step: stage.step - 1, points: stage.points.slice(0, -1) })
            }
          >
            <BackChevron />
          </button>
          <span className={styles.segments} aria-hidden="true">
            {loykrathongQuiz.map((q, i) => (
              <span
                key={q.id}
                className={`${styles.segment} ${
                  i < stage.step ? styles.done : i === stage.step ? styles.current : ''
                }`}
              />
            ))}
          </span>
        </span>
      )}
    </div>
  );

  const place = (
    <span>
      บูธ{theme.name} · {event.place}
    </span>
  );

  if (stage.kind === 'idle') {
    return (
      <main className={styles.stage}>
        {head}
        <div className={styles.idle}>
          <div className={styles.idleText}>
            <p className={styles.note}>{theme.theme}</p>
            <h1 className={styles.question}>{boothQuizTitle}</h1>
            <p className={styles.lead}>{kiosk.idleBody}</p>
            <button
              type="button"
              className={styles.start}
              style={{ color: 'var(--white)' }}
              onClick={() => setStage({ kind: 'quiz', step: 0, points: [] })}
            >
              {kiosk.idleAction}
            </button>
          </div>
          <div className={styles.idleArt}>
            <BoothMarigold />
          </div>
        </div>
        <div className={styles.foot}>
          {place}
          <span>{event.date}</span>
        </div>
      </main>
    );
  }

  if (stage.kind === 'quiz') {
    const question = loykrathongQuiz[stage.step];
    return (
      <main className={styles.stage}>
        {head}
        <div className={styles.body}>
          <p className={styles.note}>{question.note}</p>
          <h1 className={styles.question} tabIndex={-1} ref={headingRef} key={question.id}>
            {question.headline}
          </h1>
          <div className={styles.answers}>
            {question.choices.map((choice) => (
              <button
                key={choice.id}
                type="button"
                className={styles.answer}
                onClick={() => {
                  const points = [...stage.points, choice.points];
                  if (stage.step + 1 < loykrathongQuiz.length) {
                    setStage({ kind: 'quiz', step: stage.step + 1, points });
                  } else {
                    finish(points);
                  }
                }}
              >
                <ChoiceMark mark={choice.mark} />
                <span className={styles.answerLabel}>{choice.label}</span>
              </button>
            ))}
          </div>
        </div>
        <div className={styles.foot}>
          {place}
          <span>{event.date}</span>
        </div>
      </main>
    );
  }

  const flower = flowerFromPoints(stage.points);

  return (
    // Any touch on the result restarts the countdown: a student still reading
    // is never cut off, only one who has walked away.
    <main className={styles.stage} onPointerDown={() => setRemaining(kiosk.resetSeconds)}>
      {head}
      <div className={styles.result}>
        <div className={styles.resultText}>
          <p className={`${styles.note} ${styles.rise}`}>{kiosk.resultNote}</p>
          <h1 className={`${styles.flowerName} ${styles.rise}`}>{flower.name}</h1>
          <p className={`${styles.resultBody} ${styles.rise}`}>{flower.body}</p>

          <div className={`${styles.wish} ${styles.rise}`}>
            <span className={styles.wishLabel}>{kiosk.wishLabel}</span>
            <span className={styles.wishText}>{flower.wish}</span>
          </div>

          <div className={`${styles.ticket} ${styles.rise}`}>
            <span className={styles.ticketTitle}>{kiosk.ticketTitle}</span>
            <span className={styles.ticketBody}>รับ{withDok(flower.name)}ไปแต่งกระทงได้เลย</span>
          </div>
        </div>

        <div className={styles.resultSide}>
          {/* The bloom: petals scale in one after another, once, then stop (§9).
              INTERIM art: only the marigold has a hand-drawn illustration. The
              other five show the tinted rosette from the TV wall until each
              flower gets its own drawing — a stand-in, not the finished art, and
              it must not be mistaken for a lotus or an orchid. */}
          <div className={`${styles.resultArt} ${styles.bloom}`} key={flower.id}>
            {flower.id === 'marigold' ? (
              <BoothMarigold />
            ) : (
              <>
                <WallFlower tint={flower.tint} size={320} />
                <Sparkle className={`${styles.sparkle} ${styles.sparkleA}`} />
                <Sparkle className={`${styles.sparkle} ${styles.sparkleB}`} />
              </>
            )}
          </div>

          <section className={`${styles.next} ${styles.rise}`}>
            <h2 className={styles.nextTitle}>{boothNext.title}</h2>
            {boothNext.items.map((item, i) => (
              <div key={item} className={styles.nextRow}>
                <SuggestionMarker
                  variant={(i % 3) as 0 | 1 | 2}
                  size={26}
                  style={{ marginTop: 0 }}
                />
                <span>{item}</span>
              </div>
            ))}
          </section>
        </div>
      </div>

      <button
        type="button"
        className={styles.again}
        style={{ color: 'var(--white)' }}
        onClick={reset}
      >
        {kiosk.again}
      </button>
      <div className={styles.foot}>
        {place}
        <span className={styles.countdown}>
          {kiosk.resetHint} {remaining} วิ
        </span>
      </div>
    </main>
  );
}
