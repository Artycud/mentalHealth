'use client';

import { useRouter } from 'next/navigation';
import { useMemo } from 'react';

import { PhoneQuiz, type QuizQuestion } from '@/components/quiz/PhoneQuiz';
import { common } from '@/content/th/common';
import { questionNote, questions } from '@/content/th/questions';
import { clearAnswers, saveAnswers } from '@/lib/checkin-store';

/**
 * The 8-question check-in (BRIEF §8, §9). The questions are content; this wires
 * them to the shared phone quiz and hands the answers to the result screen.
 */
export function CheckinFlow() {
  const router = useRouter();

  const quiz = useMemo<QuizQuestion[]>(
    () =>
      questions.map((q) => ({
        id: q.id,
        note: questionNote,
        headline: q.headline,
        choices: q.choices.map((c) => ({ id: c.id, label: c.label, icon: c.icon })),
      })),
    [],
  );

  return (
    <PhoneQuiz
      questions={quiz}
      finishLabel={common.actions.seeResult}
      // A fresh run never shows the last run's answers, even if the tab is reused.
      onStart={clearAnswers}
      onExit={() => router.push('/')}
      onFinish={(answers) => {
        saveAnswers(answers);
        router.push('/result');
      }}
    />
  );
}
