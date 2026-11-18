'use client';

import { useRouter } from 'next/navigation';
import { Fragment, useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';

import { IdleBackdrop } from '@/components/booth/art';
import { FloatChoices } from '@/components/booth/FloatChoices';
import { FlowerArt } from '@/components/booth/FlowerArt';
import { tintInk, tintText } from '@/components/booth/flower-marks';
import { KeepAwake } from '@/components/booth/KeepAwake';
import { QrCode } from '@/components/booth/QrCode';
import { TvControls } from '@/components/booth/TvControls';
import { WallFlower } from '@/components/booth/WallFlower';
import {
  FestivalHero,
  FestivalOffering,
  FestivalRiver,
  FestivalSky,
  hasFestivalHero,
} from '@/components/festival/registry';
import { BackChevron, Wordmark } from '@/components/illustrations/icons';
import { BoothMarigold } from '@/components/illustrations/scenes';
import {
  kiosk,
  loykrathongQuiz,
  tv,
  qrInvite,
  resultFromChoices,
  withDok,
  type BoothPick,
  type FestivalTheme,
  type Reward,
} from '@/content/th/booth';
import { common, cudCare } from '@/content/th/common';
import type { EventText } from '@/lib/events';
import { createTracker, type Tracker } from '@/lib/track';
import type { Tint } from '@/lib/types';

import styles from './kiosk.module.css';

type Stage =
  | { kind: 'idle' }
  /** `dir` is which way the last move went, so the slide can follow it. */
  | { kind: 'quiz'; step: number; picks: BoothPick[]; dir: 1 | -1 }
  | { kind: 'result'; picks: BoothPick[] };

/** Today's count of one flower, for the staff's stock line on the idle screen. */
export interface StockLine {
  id: string;
  name: string;
  tint: Tint;
  count: number;
}

/** How long a chosen slip takes to float away before the next question. */
const FLOAT_MS = 820;

const STEPS = loykrathongQuiz.length;

/**
 * The booth kiosk: the one iPad at the booth. Staff hold it, hand it to each
 * student, and take it back to give out the flower.
 *
 * It asks the student council's five questions, set on a Loy Krathong night
 * (content/th/booth.ts). Each answer is a slip of paper: tap it or flick it up,
 * and it floats away before the next question comes in (components/booth/
 * FloatChoices). The result names the feeling most of the answers pointed at, at
 * one of two strengths, and the flower for it: one to let float away with the
 * krathong, or one to pass on.
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
  /** The slip just chosen, floating away for FLOAT_MS before the next question. */
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
   *  runs the timer. */
  const finish = useCallback((picks: BoothPick[]) => {
    tracker.current?.complete();
    setRemaining(kiosk.resetSeconds);
    setStage({ kind: 'result', picks });
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

  // The result counts down every second; the QR code is encoded once, not on each tick.
  const qr = useMemo(() => <QrCode value={qrUrl} label={qrInvite.title} />, [qrUrl]);

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
                  picks: stage.picks.slice(0, stage.step - 1),
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

  // The quiz and the result share the idle screen's night, quieter: a small moon
  // between the two columns and a few lanterns, so nothing competes with the heart.
  const quietSky = (
    <div className={`${styles.sky} ${styles.skyQuiet}`}>
      <FestivalSky id={theme.id} moon lanterns />
    </div>
  );

  if (stage.kind === 'idle') {
    const given = stock.reduce((sum, f) => sum + f.count, 0);
    const hero = hasFestivalHero(theme.id);
    return (
      <main className={`${styles.stage} ${styles.withShore}`} data-festival={theme.id}>
        <KeepAwake />
        {/* For staff: one tap puts the iPad full screen. Only on this screen, never mid-quiz. */}
        <TvControls label={tv.fullscreen} touch />
        <div className={styles.sky}>
          <FestivalSky id={theme.id} moon lanterns />
        </div>
        {head}
        <div className={styles.idle}>
          <div className={styles.idleText}>
            <p className={styles.note}>{theme.theme}</p>
            <h1 className={styles.question}>
              <Phrases text={kiosk.idleTitle} />
            </h1>
            <p className={styles.lead}>{kiosk.idleBody}</p>
            {reward && <p className={styles.reward}>{reward.kioskLine}</p>}
            <button
              type="button"
              className={styles.start}
              onClick={() => {
                tracker.current = createTracker('booth');
                tracker.current.start();
                setStage({ kind: 'quiz', step: 0, picks: [], dir: 1 });
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

          {/* The festival's own picture stands on the water (below); a festival
              without one keeps the booth's marigold here. */}
          <div className={styles.idleArt}>
            {!hero && (
              <>
                <div className={styles.layer}>
                  <IdleBackdrop />
                </div>
                {/* The flower sways and its petals breathe; see kiosk.module.css. */}
                <div className={`${styles.layer} ${styles.idleFlower}`}>
                  <BoothMarigold />
                </div>
              </>
            )}
          </div>
        </div>
        {/* A slim river along the bottom: the festival's water, with no moon, and
            its far bank. */}
        <div className={styles.shore}>
          <FestivalRiver id={theme.id} moon={false} bank />
        </div>
        {hero && (
          <div className={styles.hero}>
            <FestivalHero id={theme.id} />
          </div>
        )}
        {foot(<span>{event.date}</span>, true)}
      </main>
    );
  }

  if (stage.kind === 'quiz') {
    const question = loykrathongQuiz[stage.step];

    /** The slip chosen: it floats away, then the next question (or the result). */
    const choose = (choiceId: string) => {
      if (picked) return; // one answer per question
      setPicked(choiceId);
      tracker.current?.answer(question.id, choiceId);
      const picks = [...stage.picks, { questionId: question.id, choiceId }];
      advance.current = setTimeout(() => {
        setPicked(null);
        if (stage.step === STEPS - 1) finish(picks);
        else setStage({ kind: 'quiz', step: stage.step + 1, picks, dir: 1 });
      }, FLOAT_MS);
    };

    return (
      <main className={styles.stage} data-festival={theme.id}>
        <KeepAwake />
        {quietSky}
        {head}
        {/* Re-keyed per question so each one slides in from the side it came. */}
        <div className={styles.quiz} key={question.id} data-dir={stage.dir}>
          <div className={styles.quizLeft}>
            <p className={styles.note}>{question.note}</p>
            <h1 className={styles.headline} tabIndex={-1} ref={headingRef}>
              <Phrases text={question.headline} />
            </h1>
            <p className={styles.hint}>{kiosk.floatHint}</p>
          </div>

          <FloatChoices
            choices={question.choices}
            scene={question.scene}
            picked={picked}
            onPick={choose}
            label={question.headline}
          />
        </div>
        {foot(<span>{event.date}</span>)}
      </main>
    );
  }

  const result = resultFromChoices(stage.picks)!;
  const { flower } = result;
  const level = flower.levels[result.level];
  const ink = tintInk(flower.tint);

  return (
    // Any touch on the result restarts the countdown: a student still reading
    // is never cut off, only one who has walked away.
    <main
      className={styles.stage}
      data-festival={theme.id}
      onPointerDown={() => setRemaining(kiosk.resetSeconds)}
    >
      <KeepAwake />
      {quietSky}
      {head}
      {/* The coupon arrives as a notification, the way a phone tells you something
          good just came in. For the staff too: hand over both. */}
      {reward && (
        <div className={styles.toast} role="status">
          <span className={styles.toastIcon} aria-hidden="true">
            <svg viewBox="0 0 40 28">
              <path d="M4 4 H36 V10 A4 4 0 0 0 36 18 V24 H4 V18 A4 4 0 0 0 4 10 Z" />
              <path d="M15 4 V24" className={styles.toastPerf} />
            </svg>
          </span>
          <span className={styles.toastText}>
            <span className={styles.toastTitle}>{reward.toastTitle}</span>
            <span className={styles.toastBody}>{reward.received}</span>
          </span>
        </div>
      )}

      {/* One scene, no boxes: the heart the student made, a glowing path, and the
          flower for that heart. Each one's words sit under it. */}
      <div className={styles.scene}>
        <section className={`${styles.sceneSide} ${styles.rise}`}>
          <p className={styles.sceneLabel}>{kiosk.resultNote}</p>
          {/* How strongly: one petal for each answer that pointed at this feeling. */}
          <div className={styles.resultHeart}>
            <ScorePetals score={result.score} of={result.of} ink={ink} label={kiosk.scoreLine(result.score, result.of)} />
          </div>
          <p className={styles.feelingWord}>
            <span className={styles.chip} style={{ '--mood': ink, '--mood-ink': tintText(flower.tint) } as CSSProperties}>
              {level.word}
            </span>
          </p>
          <p className={styles.feelingMessage}>{level.body}</p>
          <p className={styles.scoreLine}>{kiosk.scoreLine(result.score, result.of)}</p>
        </section>

        <div className={`${styles.bridge} ${styles.rise}`} aria-hidden="true">
          <svg viewBox="0 0 240 90">
            <defs>
              {/* The head follows the curve's own direction at its end. */}
              <marker
                id="kiosk-bridge-head"
                viewBox="0 0 12 12"
                refX="7"
                refY="6"
                markerWidth="7"
                markerHeight="7"
                orient="auto"
                markerUnits="strokeWidth"
              >
                <path d="M2 2 L9 6 L2 10" className={styles.bridgeHead} />
              </marker>
            </defs>
            {/* A faint solid trail under a flow of dots, so the curve reads at once. */}
            <path d="M14 70 Q120 -14 222 64" className={styles.bridgeTrail} />
            <path d="M14 70 Q120 -14 222 64" className={styles.bridgePath} markerEnd="url(#kiosk-bridge-head)" />
            <path d="M120 2 l2.4 6 6 2.4 -6 2.4 -2.4 6 -2.4 -6 -6 -2.4 6 -2.4 Z" className={styles.spark} />
          </svg>
        </div>

        <section className={`${styles.sceneSide} ${styles.rise}`}>
          <p className={styles.sceneLabel}>{kiosk.flowerFor}</p>
          {/* Handed back in the festival's way (a krathong held out in two hands at
              Loy Krathong), or on its own. */}
          <div className={styles.resultFlower}>
            <FestivalOffering id={theme.id}>
              <FlowerArt flower={flower} />
            </FestivalOffering>
          </div>
          <h1 className={styles.flowerName}>{flower.name}</h1>
          <p className={styles.flowerBody}>
            <span className={styles.way}>{flower.way === 'let-go' ? kiosk.letGo : kiosk.passOn}</span>
            {flower.release}
          </p>
          {/* For the staff: what to hand over. */}
          <p className={styles.take}>
            รับ{withDok(flower.name)}ไปแต่งกระทงได้เลย
          </p>
        </section>
      </div>

      <div className={`${styles.resultFoot} ${styles.rise}`}>
        {/* The flower's wish, warmly, with a route to CUD Care. */}
        <div className={styles.reply}>
          <span className={styles.replyLabel}>{kiosk.wishLabel}</span>
          <span className={styles.replyText}>{flower.wish}</span>
          <span className={styles.care}>{cudCare.result.body}</span>
        </div>
        {/* The bridge to the main site, for later: white only behind the code. */}
        <div className={styles.qrMini}>
          <div className={styles.qrBox}>{qr}</div>
          <div className={styles.qrText}>
            <span className={styles.qrTitle}>{qrInvite.title}</span>
            <span className={styles.qrBody}>{qrInvite.body}</span>
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

/**
 * How strongly the answers pointed at the feeling: a five-petal flower, one petal
 * lit in the flower's own colour for each answer that pointed there.
 */
function ScorePetals({ score, of, ink, label }: { score: number; of: number; ink: string; label: string }) {
  return (
    <svg viewBox="0 0 100 100" role="img" aria-label={label} className={styles.petals}>
      {Array.from({ length: of }, (_, i) => {
        const a = (i / of) * Math.PI * 2 - Math.PI / 2;
        const x = 50 + Math.cos(a) * 24;
        const y = 50 + Math.sin(a) * 24;
        const on = i < score;
        // Turned by its group, so the petal's own fade-in never touches the turn.
        return (
          <g key={i} transform={`rotate(${(a * 180) / Math.PI + 90} ${x} ${y})`}>
            <ellipse
              cx={x}
              cy={y}
              rx="15"
              ry="22"
              fill={on ? ink : 'rgba(255, 255, 255, 0.14)'}
              stroke={on ? 'none' : 'rgba(255, 255, 255, 0.35)'}
              strokeWidth="1.2"
              style={{ '--i': i } as CSSProperties}
              className={on ? styles.petalOn : undefined}
            />
          </g>
        );
      })}
      <circle cx="50" cy="50" r="12" fill="var(--sunflower)" />
    </svg>
  );
}

/**
 * Thai has no spaces between words, so a browser breaks a line wherever its
 * dictionary finds a word boundary, and it does not know every word: big
 * headlines came out as "แบ|ตมือถือ" and "ตอน|นี้". The copy already puts a
 * space between its phrases, so lines break only there. A space before ๆ is part
 * of the word, never a place to break. (The TV does the same for its QR card.)
 */
function Phrases({ text }: { text: string }) {
  // The space sits outside the phrases: a space at the end of a no-wrap box is
  // dropped, and the words would run together.
  return text.split(/ (?!ๆ)/).map((part, i) => (
    <Fragment key={i}>
      {i > 0 && ' '}
      <span className={styles.phrase}>{part}</span>
    </Fragment>
  ));
}
