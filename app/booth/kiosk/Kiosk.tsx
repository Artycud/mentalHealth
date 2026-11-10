'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

import { IdleBackdrop, QuizArt } from '@/components/booth/art';
import { ChoiceMark } from '@/components/booth/ChoiceMark';
import { FlowerArt } from '@/components/booth/FlowerArt';
import { KeepAwake } from '@/components/booth/KeepAwake';
import { QrCode } from '@/components/booth/QrCode';
import { WallFlower } from '@/components/booth/WallFlower';
import { FestivalRiver } from '@/components/festival/registry';
import {
  BackChevron,
  CheckBadge,
  Wordmark,
} from '@/components/illustrations/icons';
import { BoothMarigold } from '@/components/illustrations/scenes';
import {
  boothQuizTitle,
  flowerFromAnswers,
  hiddenLabel,
  kiosk,
  loykrathongQuiz,
  okayQuestion,
  okayReply,
  okayReplyLabel,
  qrInvite,
  withDok,
  type BoothAnswer,
  type FestivalTheme,
  type OkayChoiceId,
} from '@/content/th/booth';
import { common, cudCare } from '@/content/th/common';
import type { EventText } from '@/lib/events';
import { createTracker, type Tracker } from '@/lib/track';
import type { Tint } from '@/lib/types';

import styles from './kiosk.module.css';

type Stage =
  | { kind: 'idle' }
  /** `dir` is which way the last move went, so the slide can follow it. */
  | { kind: 'quiz'; step: number; answers: BoothAnswer[]; dir: 1 | -1 }
  | { kind: 'result'; answers: BoothAnswer[]; okay: OkayChoiceId };

/** Today's count of one flower, for the staff's stock line on the idle screen. */
export interface StockLine {
  id: string;
  name: string;
  tint: Tint;
  count: number;
}

/** How long a tapped answer stays visibly selected before the next question. */
const SELECT_MS = 260;

/** The three flower questions, then the honest one (never scored). */
const STEPS = loykrathongQuiz.length + 1;
const OKAY_STEP = loykrathongQuiz.length;

/**
 * The booth kiosk: the one iPad at the booth. Staff hold it, hand it to each
 * student for four taps, and take it back to give out the flower.
 *
 * What follows from that:
 *  - It must always return to a clean start. Staff tap "คนต่อไป"; if nobody does,
 *    the result resets itself after kiosk.resetSeconds of no touching, so a
 *    student's answer is never left up for the next person — which is also a
 *    privacy point (§12). Any touch restarts the count.
 *  - Nothing persists in the browser between students. State lives in memory
 *    only, and the session it writes is anonymous like every other.
 *  - It never reloads blind. The stock line refreshes only after the server has
 *    answered a ping, so a dropped Wi-Fi can never turn the iPad into a browser
 *    error page in the middle of the booth (see components/booth/AutoRefresh).
 *
 * The booth's one idea is that looking okay and being okay are not the same thing,
 * and that both are normal. So after the three flower questions it asks one honest,
 * unscored question, and every result says the other side of its flower and
 * answers that question warmly, with a route to CUD Care (§12) and a QR code to the
 * main site for the deeper questions later.
 */
export function Kiosk({
  theme,
  event,
  stock,
  qrUrl,
}: {
  theme: FestivalTheme;
  event: EventText;
  stock: StockLine[];
  qrUrl: string;
}) {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>({ kind: 'idle' });
  const [remaining, setRemaining] = useState<number>(kiosk.resetSeconds);
  /** The answer just tapped, held on screen for SELECT_MS before moving on. */
  const [picked, setPicked] = useState<string | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const advance = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  // One per student. It starts when they press start and is dropped on reset, so
  // the next student is a new, unrelated session (BRIEF §3, §12).
  const tracker = useRef<Tracker | null>(null);

  // A pending move must never fire after the kiosk has been reset or unmounted.
  useEffect(() => () => clearTimeout(advance.current), []);

  /** Re-reads the stock line, but only once the server has answered. */
  const refreshStock = useCallback(async () => {
    try {
      const response = await fetch('/api/booth/ping', { cache: 'no-store' });
      if (response.ok) router.refresh();
    } catch {
      /* offline: keep the last numbers; the quiz itself never needs the network */
    }
  }, [router]);

  const reset = useCallback(() => {
    clearTimeout(advance.current);
    tracker.current = null;
    setPicked(null);
    setStage({ kind: 'idle' });
    // A moment later, so the result just sent has reached the server first.
    setTimeout(() => void refreshStock(), 1200);
  }, [refreshStock]);

  /** Entering the result also arms the countdown, so the effect below only ever
   *  runs the timer. Resetting `remaining` inside the effect instead would set
   *  state during render and cascade an extra render every time. */
  const finish = useCallback((answers: BoothAnswer[], okay: OkayChoiceId) => {
    tracker.current?.complete();
    setRemaining(kiosk.resetSeconds);
    setStage({ kind: 'result', answers, okay });
  }, []);

  // Auto-reset the result for the next student, if staff have not already.
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
                  answers: stage.answers.slice(0, stage.step - 1),
                  dir: -1,
                });
              }
            }}
          >
            <BackChevron />
          </button>
          <span className={styles.segments} aria-hidden="true">
            {Array.from({ length: STEPS }, (_, i) => (
              <span
                key={i}
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

  const foot = (right: React.ReactNode, onWater = false) => (
    <div className={`${styles.foot} ${onWater ? styles.footOnWater : ''}`}>
      <span>
        บูธ{theme.name} · {event.place}
      </span>
      {right}
    </div>
  );

  if (stage.kind === 'idle') {
    const given = stock.reduce((sum, f) => sum + f.count, 0);
    return (
      <main className={`${styles.stage} ${styles.withShore}`} data-festival={theme.id}>
        <KeepAwake />
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
              onClick={() => {
                tracker.current = createTracker('booth');
                tracker.current.start();
                setStage({ kind: 'quiz', step: 0, answers: [], dir: 1 });
              }}
            >
              {kiosk.idleAction}
            </button>
            {/* For the staff holding the iPad: what has gone out today, so they can
                see a flower running low. The same anonymous counts the TV shows. */}
            <p className={styles.stock}>
              <span className={styles.stockTitle}>
                {kiosk.stockTitle} {given}
              </span>
              {stock.map((f) => (
                <span key={f.id} className={styles.stockItem}>
                  <span className={styles.stockMark} aria-hidden="true">
                    <WallFlower tint={f.tint} />
                  </span>
                  {f.name.replace(/^ดอก/, '')} {f.count}
                </span>
              ))}
            </p>
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
        {/* A slim river along the bottom: the festival's water, with no moon. */}
        <div className={styles.shore}>
          <FestivalRiver id={theme.id} moon={false} />
        </div>
        {foot(<span>{event.date}</span>, true)}
      </main>
    );
  }

  if (stage.kind === 'quiz') {
    const isOkay = stage.step === OKAY_STEP;
    const question = isOkay ? okayQuestion : loykrathongQuiz[stage.step];
    return (
      <main className={styles.stage} data-festival={theme.id}>
        <KeepAwake />
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
                    tracker.current?.answer(question.id, choice.id);
                    advance.current = setTimeout(() => {
                      setPicked(null);
                      if (isOkay) {
                        finish(stage.answers, choice.id as OkayChoiceId);
                        return;
                      }
                      const q = loykrathongQuiz[stage.step];
                      const value = q.choices.find((c) => c.id === choice.id)?.value ?? 0;
                      const answers = [...stage.answers, { axis: q.axis, value }];
                      setStage({ kind: 'quiz', step: stage.step + 1, answers, dir: 1 });
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
    <main
      className={styles.stage}
      data-festival={theme.id}
      onPointerDown={() => setRemaining(kiosk.resetSeconds)}
    >
      <KeepAwake />
      {head}
      <div className={styles.result}>
        <div className={styles.resultText}>
          <p className={`${styles.note} ${styles.rise}`}>{kiosk.resultNote}</p>
          <h1 className={`${styles.flowerName} ${styles.rise}`}>{flower.name}</h1>
          <p className={`${styles.resultBody} ${styles.rise}`}>{flower.body}</p>

          {/* The other side of the flower: even this one has tired days. */}
          <div className={`${styles.hidden} ${styles.rise}`}>
            <span className={styles.smallLabel}>{hiddenLabel}</span>
            <span className={styles.hiddenText}>{flower.hidden}</span>
          </div>

          {/* The honest question, answered back warmly, with a route to CUD Care. */}
          <div className={`${styles.reply} ${styles.rise}`}>
            <span className={styles.smallLabel}>{okayReplyLabel}</span>
            <span className={styles.replyText}>{okayReply[stage.okay]}</span>
            <span className={styles.care}>{cudCare.result.body}</span>
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
          <p className={`${styles.wishLine} ${styles.rise}`}>“{flower.wish}”</p>

          {/* The bridge to the main site: the booth is the quick part; the deeper
              questions are for later, in the student's own time. */}
          <div className={`${styles.qrCard} ${styles.rise}`}>
            <div className={styles.qrBox}>
              <QrCode value={qrUrl} label={qrInvite.title} />
            </div>
            <div className={styles.qrText}>
              <span className={styles.qrTitle}>{qrInvite.title}</span>
              <span className={styles.qrBody}>{qrInvite.body}</span>
            </div>
          </div>
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
