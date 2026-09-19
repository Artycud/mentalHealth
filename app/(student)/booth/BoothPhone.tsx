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
import { flowerFromChoices, loykrathongQuiz, withDok, type Flower } from '@/content/th/booth';
import { common } from '@/content/th/common';
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
 * The booth quiz on a student's own phone: three questions, then a result to show
 * at the booth to collect a real flower (BRIEF §1, §8). The kiosk at the booth
 * runs the same quiz on a shared device; both give the same flower for the same
 * answers.
 *
 * Booth mode runs on trust — staff just look at the screen — so there is no code
 * or token here, and nothing to check (§12).
 */
export function BoothPhone({ festival, label, resultNote, ticketTitle, where }: BoothPhoneProps) {
  const router = useRouter();
  const [flower, setFlower] = useState<Flower | null>(null);
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
      setFlower(null);
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
          const result = flowerFromChoices(answers);
          if (!result) return; // unreachable: the quiz only finishes complete
          // A history entry for the result, so back has something to pop.
          window.history.pushState({ ...(window.history.state as object), quizDone: true }, '');
          setFlower(result);
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

        <p className={styles.note}>{resultNote}</p>
        <h1 className={`${styles.flower} ${flower.name.length > 8 ? styles.flowerLong : ''}`}>
          {flower.name}
        </h1>

        <div className={styles.art}>
          <FlowerArt flower={flower} />
        </div>

        <p className={styles.body}>{flower.body}</p>

        <BoothTicket
          title={ticketTitle}
          body={`รับ${withDok(flower.name)}ไปแต่งกระทงของคุณได้เลย`}
          where={where}
        />

        <div className={styles.actions}>
          <SecondaryButton href="/">{common.actions.home}</SecondaryButton>
          <TextLink href="/checkin">{common.actions.tryCheckin}</TextLink>
        </div>
      </Screen>
    </div>
  );
}
