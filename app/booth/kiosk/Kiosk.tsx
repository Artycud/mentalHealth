'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { IdleBackdrop, QuizArt } from '@/components/booth/art';
import { ChoiceMark } from '@/components/booth/ChoiceMark';
import { FlowerArt } from '@/components/booth/FlowerArt';
import {
  BackChevron,
  CheckBadge,
  SuggestionMarker,
  Wordmark,
} from '@/components/illustrations/icons';
import { BoothMarigold } from '@/components/illustrations/scenes';
import {
  boothNext,
  boothQuizTitle,
  flowerFromAnswers,
  kiosk,
  loykrathongQuiz,
  withDok,
  type BoothAnswer,
  type FestivalTheme,
} from '@/content/th/booth';
import { common } from '@/content/th/common';
import type { EventText } from '@/lib/events';

import styles from './kiosk.module.css';

type Stage =
  | { kind: 'idle' }
  /** `dir` is which way the last move went, so the slide can follow it. */
  | { kind: 'quiz'; step: number; answers: BoothAnswer[]; dir: 1 | -1 }
  | { kind: 'result'; answers: BoothAnswer[] };

/** How long a tapped answer stays visibly selected before the next question. */
const SELECT_MS = 260;

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
  /** The answer just tapped, held on screen for SELECT_MS before moving on. */
  const [picked, setPicked] = useState<string | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const advance = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // A pending move must never fire after the kiosk has been reset or unmounted.
  useEffect(() => () => clearTimeout(advance.current), []);

  const reset = useCallback(() => {
    clearTimeout(advance.current);
    setPicked(null);
    setStage({ kind: 'idle' });
  }, []);

  /** Entering the result also arms the countdown, so the effect below only ever
   *  runs the timer. Resetting `remaining` inside the effect instead would set
   *  state during render and cascade an extra render every time. */
  const finish = useCallback((answers: BoothAnswer[]) => {
    setRemaining(kiosk.resetSeconds);
    setStage({ kind: 'result', answers });
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
            onClick={() => {
              clearTimeout(advance.current);
              setPicked(null);
              if (stage.step === 0) {
                reset();
              } else {
                setStage({
                  kind: 'quiz',
                  step: stage.step - 1,
                  answers: stage.answers.slice(0, -1),
                  dir: -1,
                });
              }
            }}
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

  const foot = (right: React.ReactNode) => (
    <div className={styles.foot}>
      <span>
        บูธ{theme.name} · {event.place}
      </span>
      {right}
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
            <p className={styles.lead}>{kiosk.idleBody}</p>
            <button
              type="button"
              className={styles.start}
              style={{ color: 'var(--white)' }}
              onClick={() => setStage({ kind: 'quiz', step: 0, answers: [], dir: 1 })}
            >
              {kiosk.idleAction}
            </button>
          </div>

          <div className={styles.idleArt}>
            <div className={styles.layer}>
              <IdleBackdrop />
            </div>
            {/* The flower sways and its petals breathe; see kiosk.module.css. */}
            <div className={`${styles.layer} ${styles.idleFlower}`}>
              <BoothMarigold />
            </div>
          </div>
        </div>
        {foot(<span>{event.date}</span>)}
      </main>
    );
  }

  if (stage.kind === 'quiz') {
    const question = loykrathongQuiz[stage.step];
    return (
      <main className={styles.stage}>
        {head}
        {/* Re-keyed per question so each one slides in from the side it came. */}
        <div className={styles.quiz} key={question.id} data-dir={stage.dir}>
          <div className={styles.quizLeft}>
            <p className={styles.note}>{question.note}</p>
            <h1 className={styles.headline} tabIndex={-1} ref={headingRef}>
              {question.headline}
            </h1>
            <div className={styles.quizArt}>
              <QuizArt step={stage.step} />
            </div>
          </div>

          <div className={styles.answers}>
            {question.choices.map((choice) => {
              const isPicked = picked === choice.id;
              return (
                <button
                  key={choice.id}
                  type="button"
                  aria-pressed={isPicked}
                  className={`${styles.answer} ${isPicked ? styles.picked : ''}`}
                  onClick={() => {
                    if (picked) return; // one tap per question
                    setPicked(choice.id);
                    const answers = [...stage.answers, { axis: question.axis, value: choice.value }];
                    advance.current = setTimeout(() => {
                      setPicked(null);
                      if (stage.step + 1 < loykrathongQuiz.length) {
                        setStage({ kind: 'quiz', step: stage.step + 1, answers, dir: 1 });
                      } else {
                        finish(answers);
                      }
                    }, SELECT_MS);
                  }}
                >
                  <ChoiceMark mark={choice.mark} />
                  <span className={styles.answerLabel}>{choice.label}</span>
                  {/* The badge's space is always reserved, so nothing reflows. */}
                  <span className={styles.tick} aria-hidden="true">
                    <span className={styles.tickBadge}>
                      <CheckBadge />
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        {foot(<span>{event.date}</span>)}
      </main>
    );
  }

  const flower = flowerFromAnswers(stage.answers);

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
          {/* Disc, flower and bloom are the shared FlowerArt (see it for the
              interim-art note). This box only sizes it. */}
          <div className={styles.artStack}>
            <FlowerArt flower={flower} />
          </div>
          <p className={`${styles.fact} ${styles.rise}`}>
            {flower.name} · {flower.fact}
          </p>

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
      {foot(
        <span className={styles.countdown}>
          {kiosk.resetHint} {remaining} วิ
        </span>,
      )}
    </main>
  );
}
