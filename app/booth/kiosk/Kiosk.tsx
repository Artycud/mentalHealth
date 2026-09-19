'use client';

import { useCallback, useEffect, useState } from 'react';

import { WallFlower } from '@/components/booth/WallFlower';
import { BoothMarigold } from '@/components/illustrations/scenes';
import { AnswerIcon, Wordmark } from '@/components/illustrations/icons';
import {
  boothQuizTitle,
  flowerFromPoints,
  kiosk,
  loykrathongQuiz,
  type FestivalTheme,
} from '@/content/th/booth';
import { common, eventFacts } from '@/content/th/common';
import type { AnswerIcon as IconVariant } from '@/lib/types';

import styles from './kiosk.module.css';

/** Same moon phases as the phone, so the two surfaces read as one product. */
const ICONS: IconVariant[] = ['full', 'half', 'crescent', 'empty'];

type Stage = { kind: 'idle' } | { kind: 'quiz'; step: number; points: number[] } | { kind: 'result'; points: number[] };

/**
 * The booth kiosk. Runs unattended on an iPad or laptop for two hours while a
 * queue of students uses it one after another.
 *
 * Two things follow from that, and drive the whole component:
 *  - It must always return to a clean start. The result auto-resets after
 *    kiosk.resetSeconds, so a student who walks off does not leave their answer
 *    on screen for the next person — which is also a privacy point (§12).
 *  - Nothing persists in the browser between students. State lives in memory
 *    only, and the session write in phase 4 is anonymous like every other.
 */
export function Kiosk({ theme }: { theme: FestivalTheme }) {
  const [stage, setStage] = useState<Stage>({ kind: 'idle' });
  const [remaining, setRemaining] = useState<number>(kiosk.resetSeconds);

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

  const head = (
    <div className={styles.head}>
      <span className={styles.brand}>
        <Wordmark />
        {common.wordmark}
      </span>
      {stage.kind === 'quiz' && (
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
      )}
    </div>
  );

  const foot = (
    <div className={styles.foot}>
      <span>
        บูธ{theme.name} · {eventFacts.boothPlace}
      </span>
      <span>{theme.date}</span>
    </div>
  );

  if (stage.kind === 'idle') {
    return (
      <main className={styles.stage}>
        {head}
        <div className={styles.idle}>
          <div className={styles.idleText}>
            <p className={styles.note}>{theme.theme}</p>
            <h1 className={styles.question}>{boothQuizTitle}</h1>
            <p className={styles.resultBody}>{kiosk.idleBody}</p>
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
        {foot}
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
          {/* Focus follows the question so a keyboard or screen reader keeps up (§9). */}
          <h1 className={styles.question} tabIndex={-1} key={question.id}>
            {question.headline}
          </h1>
          <div className={styles.answers}>
            {question.choices.map((choice, i) => (
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
                <AnswerIcon variant={ICONS[i]} />
                <span className={styles.answerLabel}>{choice.label}</span>
              </button>
            ))}
          </div>
        </div>
        {foot}
      </main>
    );
  }

  const flower = flowerFromPoints(stage.points);

  return (
    <main className={styles.stage}>
      {head}
      <div className={styles.result}>
        <div className={styles.resultText}>
          <p className={styles.note}>{kiosk.resultNote}</p>
          <h1 className={styles.flowerName}>{flower.name}</h1>
          <p className={styles.resultBody}>{flower.body}</p>
          <div className={styles.ticket}>
            <span className={styles.ticketTitle}>{kiosk.ticketTitle}</span>
            <span className={styles.ticketBody}>{kiosk.ticketBody}</span>
          </div>
        </div>
        <div className={styles.resultArt}>
          {/* INTERIM: only the marigold has a hand-drawn illustration. The other
              five show the tinted rosette from the TV wall until each flower
              gets its own drawing — it is a stand-in, not the finished art, and
              must not be mistaken for a lotus or an orchid. */}
          {flower.id === 'marigold' ? <BoothMarigold /> : <WallFlower tint={flower.tint} size={320} />}
        </div>
      </div>
      <button type="button" className={styles.again} style={{ color: 'var(--white)' }} onClick={reset}>
        {kiosk.again}
      </button>
      <div className={styles.foot}>
        <span>
          บูธ{theme.name} · {eventFacts.boothPlace}
        </span>
        <span className={styles.countdown}>
          {kiosk.resetHint} {remaining} วิ
        </span>
      </div>
    </main>
  );
}
