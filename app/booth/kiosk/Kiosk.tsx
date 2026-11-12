'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';

import { IdleBackdrop, QuizArt } from '@/components/booth/art';
import { ChoiceMark } from '@/components/booth/ChoiceMark';
import { FeelingMeter, third } from '@/components/booth/FeelingMeter';
import { FlowerArt } from '@/components/booth/FlowerArt';
import { KeepAwake } from '@/components/booth/KeepAwake';
import { QrCode } from '@/components/booth/QrCode';
import { TopicIcon } from '@/components/booth/TopicIcon';
import { WallFlower } from '@/components/booth/WallFlower';
import { FestivalRiver } from '@/components/festival/registry';
import { BackChevron, CheckBadge, Wordmark } from '@/components/illustrations/icons';
import { BoothMarigold } from '@/components/illustrations/scenes';
import {
  feelingCell,
  feelingFromAnswers,
  flowerFromAnswers,
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
  type Reward,
} from '@/content/th/booth';
import { common, cudCare } from '@/content/th/common';
import { feelings } from '@/content/th/heart';
import type { EventText } from '@/lib/events';
import { moodColour, rgb } from '@/lib/heart';
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

/** The feeling questions, then the honest one (never scored). */
const STEPS = loykrathongQuiz.length + 1;
const OKAY_STEP = loykrathongQuiz.length;

/** A meter starts in the middle, untouched. */
const FRESH = { v: 0.5, touched: false };

/** The mood colour (the home's own) for a feeling cell's centre. */
const moodFor = (energy: number, weight: number) => rgb(moodColour(energy, weight));

/**
 * The booth kiosk: the one iPad at the booth. Staff hold it, hand it to each
 * student, and take it back to give out the flower.
 *
 * It asks how the student's heart is right now, the way the home's "ใจวันนี้"
 * does, through two things everyone knows: drag a phone battery to how much
 * charge is left, drag a school bag to how heavy today is. The picture follows the
 * finger and says what that much feels like, so there is nothing to explain. Then
 * one tap for what fills their head, and the honest "โอเคไหม". The result names
 * the feeling (one of the home's nine) and gives the flower for that heart.
 *
 * What follows from being a shared device:
 *  - It must always return to a clean start. Staff tap "คนต่อไป"; if nobody does,
 *    the result resets itself after kiosk.resetSeconds of no touching, so a
 *    student's answer is never left up for the next person (§12). Any touch
 *    restarts the count.
 *  - Nothing persists in the browser between students. State lives in memory
 *    only, and the session it writes is anonymous like every other.
 *  - It never reloads blind. The stock line refreshes only after the server has
 *    answered a ping (see components/booth/AutoRefresh).
 */
export function Kiosk({
  theme,
  event,
  stock,
  qrUrl,
  reward,
}: {
  theme: FestivalTheme;
  event: EventText;
  stock: StockLine[];
  qrUrl: string;
  /** The booth's reward while it lasts (the admin switches it off when it runs out). */
  reward?: Reward;
}) {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>({ kind: 'idle' });
  const [remaining, setRemaining] = useState<number>(kiosk.resetSeconds);
  /** The answer just tapped, held on screen for SELECT_MS before moving on. */
  const [picked, setPicked] = useState<string | null>(null);
  /** The current drag question's position (0 → 1) and whether it has been touched. */
  const [meter, setMeter] = useState(FRESH);
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
    setMeter(FRESH);
    setStage({ kind: 'idle' });
    // A moment later, so the result just sent has reached the server first.
    setTimeout(() => void refreshStock(), 1200);
  }, [refreshStock]);

  /** Entering the result also arms the countdown, so the effect below only ever
   *  runs the timer. */
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
              setMeter(FRESH);
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
            <h1 className={styles.question}>{kiosk.idleTitle}</h1>
            <p className={styles.lead}>{kiosk.idleBody}</p>
            {reward && <p className={styles.reward}>{reward.kioskLine}</p>}
            <button
              type="button"
              className={styles.start}
              onClick={() => {
                tracker.current = createTracker('booth');
                tracker.current.start();
                setMeter(FRESH);
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
                    {/* On a plate: multiplied straight onto the night it would go dark. */}
                    <WallFlower tint={f.tint} plate />
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
    const quizQ = isOkay ? null : loykrathongQuiz[stage.step];
    const energyAnswer = stage.answers.find((a) => a.axis === 'energy');
    const weightAnswer = stage.answers.find((a) => a.axis === 'weight');

    /** Record an answer and move on (or finish, after the honest question). */
    const answer = (choiceId: string, value: number) => {
      tracker.current?.answer(question.id, choiceId);
      if (isOkay) {
        finish(stage.answers, choiceId as OkayChoiceId);
        return;
      }
      const answers = [...stage.answers, { axis: quizQ!.axis, value }];
      setMeter(FRESH);
      setStage({ kind: 'quiz', step: stage.step + 1, answers, dir: 1 });
    };

    // The heart so far: shown live while the bag is dragged, and on the topic step.
    let mood: { colour: string; word: string; label: string } | null = null;
    if (quizQ?.axis === 'weight' && energyAnswer) {
      const e = energyAnswer.value / 2;
      mood = {
        colour: moodFor(e, meter.v),
        word: feelings[third(meter.v)][energyAnswer.value].word,
        label: kiosk.liveHeart,
      };
    } else if (quizQ?.axis === 'topic' && energyAnswer && weightAnswer) {
      const { row, col } = feelingCell(stage.answers);
      mood = { colour: moodFor(col / 2, row / 2), word: feelings[row][col].word, label: kiosk.resultNote };
    }

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
            {quizQ?.meter && <p className={styles.hint}>{quizQ.meter.hint}</p>}
            {mood && (
              <div className={styles.mood} style={{ '--mood': mood.colour } as CSSProperties}>
                <span className={styles.moodLabel}>{mood.label}</span>
                <span className={styles.moodWord}>{mood.word}</span>
              </div>
            )}
            {isOkay && (
              <div className={styles.quizArt}>
                <QuizArt step={3} />
              </div>
            )}
          </div>

          {quizQ?.meter ? (
            // A drag: the picture follows the finger; "next" once it has been touched.
            <div className={styles.meterSide}>
              <FeelingMeter
                kind={quizQ.meter.kind}
                value={meter.v}
                touched={meter.touched}
                onChange={(v) => setMeter({ v, touched: true })}
                ends={quizQ.meter.ends}
                anchors={quizQ.meter.anchors}
                label={quizQ.headline}
                dragMe={kiosk.dragMe}
              />
              <button
                type="button"
                className={styles.next}
                disabled={!meter.touched}
                onClick={() => {
                  const choice = quizQ.choices[third(meter.v)];
                  answer(choice.id, choice.value);
                }}
              >
                {meter.touched ? quizQ.meter.go : kiosk.touchFirst}
              </button>
            </div>
          ) : quizQ?.axis === 'topic' ? (
            // One tap on a picture.
            <div className={styles.topics}>
              {quizQ.choices.map((choice) => {
                const isPicked = picked === choice.id;
                return (
                  <button
                    key={choice.id}
                    type="button"
                    aria-pressed={isPicked}
                    className={`${styles.topic} ${isPicked ? styles.picked : ''}`}
                    onClick={() => {
                      if (picked) return; // one tap per question
                      setPicked(choice.id);
                      advance.current = setTimeout(() => {
                        setPicked(null);
                        answer(choice.id, choice.value);
                      }, SELECT_MS);
                    }}
                  >
                    {choice.icon && <TopicIcon icon={choice.icon} />}
                    <span className={styles.topicLabel}>{choice.label}</span>
                  </button>
                );
              })}
            </div>
          ) : (
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
                      advance.current = setTimeout(() => {
                        setPicked(null);
                        answer(choice.id, 0);
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
          )}
        </div>
        {foot(<span>{event.date}</span>)}
      </main>
    );
  }

  const flower = flowerFromAnswers(stage.answers);
  const feeling = feelingFromAnswers(stage.answers);
  const { row, col } = feelingCell(stage.answers);

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
          {/* The feeling first: the home's word for it, in the home's colour. */}
          <p className={`${styles.feelingLine} ${styles.rise}`}>
            <span className={styles.feelingLabel}>{kiosk.resultNote}</span>
            <span className={styles.feelingChip} style={{ '--mood': moodFor(col / 2, row / 2) } as CSSProperties}>
              {feeling.word}
            </span>
          </p>
          <p className={`${styles.note} ${styles.rise}`}>{kiosk.flowerFor}</p>
          <h1 className={`${styles.flowerName} ${styles.rise}`}>{flower.name}</h1>
          <p className={`${styles.resultBody} ${styles.rise}`}>{feeling.message}</p>

          {/* The honest question, answered back warmly, with a route to CUD Care. */}
          <div className={`${styles.reply} ${styles.rise}`}>
            <span className={styles.smallLabel}>{okayReplyLabel}</span>
            <span className={styles.replyText}>{okayReply[stage.okay]}</span>
            <span className={styles.care}>{cudCare.result.body}</span>
          </div>

          <div className={`${styles.ticket} ${styles.rise}`}>
            <span className={styles.ticketTitle}>{kiosk.ticketTitle}</span>
            <span className={styles.ticketBody}>รับ{withDok(flower.name)}ไปแต่งกระทงได้เลย</span>
            {/* For the staff holding the iPad: hand over both. */}
            {reward && <span className={styles.ticketReward}>{reward.ticketLine}</span>}
          </div>
        </div>

        <div className={styles.resultSide}>
          {/* Disc, flower and bloom are the shared FlowerArt. This box only sizes it. */}
          <div className={styles.artStack}>
            <FlowerArt flower={flower} />
          </div>
          {/* Why this flower: which heart it is for. */}
          <p className={`${styles.wishLine} ${styles.rise}`}>{flower.body}</p>

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

      <button type="button" className={styles.again} onClick={reset}>
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
