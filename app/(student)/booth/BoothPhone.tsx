'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { FlowerArt } from '@/components/booth/FlowerArt';
import { BoothMoon } from '@/components/illustrations/scenes';
import { BoothLabelPill, BoothTicket } from '@/components/ui/booth';
import { SecondaryButton, TextLink } from '@/components/ui/buttons';
import { PhoneQuiz, type QuizQuestion } from '@/components/quiz/PhoneQuiz';
import { Screen } from '@/components/ui/Screen';
import { WordmarkHeader } from '@/components/ui/WordmarkHeader';
import { kiosk, loykrathongQuiz, resultFromChoices, withDok, type BoothResult } from '@/content/th/booth';
import { common, cudCare } from '@/content/th/common';
import { createTracker } from '@/lib/track';
import type { FestivalId } from '@/lib/types';

import styles from './booth.module.css';

interface BoothPhoneProps {
  /** Which festival's booth this is, so its colours are in reach. */
  festival: FestivalId;
  label: string;
  resultNote: string;
  ticketTitle: string;
  /** "ที่โถงโรงอาหาร 19–20 พ.ย. 2569", built on the server from the event. */
  where: string;
}

/**
 * The booth quiz on a student's own phone: the council's five Loy Krathong
 * questions, then a result to show at the booth to collect a real flower (BRIEF
 * §1, §8). The kiosk at the booth asks the same questions as slips that float
 * away; both give the same flower for the same answers. Here they are taps,
 * which suit a phone in one hand.
 *
 * Booth mode runs on trust — staff just look at the screen — so there is no code
 * or token here, and nothing to check (§12).
 */
export function BoothPhone({ festival, label, resultNote, ticketTitle, where }: BoothPhoneProps) {
  const router = useRouter();
  const [result, setResult] = useState<BoothResult | null>(null);
  const flower = result?.flower ?? null;
  // One per run. Going back from a result to play again makes a new one.
  const [tracker, setTracker] = useState(() => createTracker('booth'));

  const quiz = useMemo<QuizQuestion[]>(
    () =>
      loykrathongQuiz.map((q) => ({
        id: q.id,
        note: q.note,
        headline: q.headline,
        choices: q.choices.map((c) => ({ id: c.id, label: c.label, mark: c.mark })),
      })),
    [],
  );

  // Once the result is up, browser back returns to the start of the quiz instead
  // of appearing to do nothing. The quiz itself owns history while it is showing.
  useEffect(() => {
    if (!flower) return;
    const back = () => {
      setResult(null);
      setTracker(createTracker('booth'));
    };
    window.addEventListener('popstate', back);
    return () => window.removeEventListener('popstate', back);
  }, [flower]);

  if (!flower) {
    return (
      <PhoneQuiz
        questions={quiz}
        finishLabel={common.actions.seeResult}
        onStart={() => tracker.start()}
        onAnswer={(a) => tracker.answer(a.questionId, a.choiceId)}
        onExit={() => router.push('/')}
        onFinish={(answers) => {
          tracker.complete();
          const got = resultFromChoices(answers);
          if (!got) return; // unreachable: the quiz only finishes complete
          // A history entry for the result, so back has something to pop.
          window.history.pushState({ ...(window.history.state as object), quizDone: true }, '');
          setResult(got);
        }}
      />
    );
  }

  return (
    <div className={styles.page} data-festival={festival}>
      <BoothMoon className={styles.moon} />

      <Screen>
        <WordmarkHeader />
        <BoothLabelPill>{label}</BoothLabelPill>

        {result && (
          <p className={styles.note}>
            {kiosk.resultNote}: {flower.levels[result.level].word}
          </p>
        )}
        <p className={styles.note}>{resultNote}</p>
        <h1 className={`${styles.flower} ${flower.name.length > 8 ? styles.flowerLong : ''}`}>
          {flower.name}
        </h1>

        <div className={styles.art}>
          <FlowerArt flower={flower} />
        </div>

        {result && <p className={styles.body}>{flower.levels[result.level].body}</p>}
        <p className={styles.body}>{flower.release}</p>

        {/* The flower's wish, and a route to CUD Care. */}
        <div className={styles.reply}>
          <span className={styles.smallLabel}>{kiosk.wishLabel}</span>
          <span className={styles.replyText}>{flower.wish}</span>
          <span className={styles.care}>{cudCare.result.body}</span>
        </div>

        <BoothTicket
          title={ticketTitle}
          body={`รับ${withDok(flower.name)}ไปแต่งกระทงของคุณได้เลย`}
          where={where}
        />

        <div className={styles.actions}>
          <SecondaryButton href="/">{common.actions.home}</SecondaryButton>
          <TextLink href="/checkup">{common.actions.tryCheckin}</TextLink>
        </div>
      </Screen>
    </div>
  );
}
