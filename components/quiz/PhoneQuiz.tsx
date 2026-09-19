'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { AnswerCard } from '@/components/ui/AnswerCard';
import { PrimaryAction } from '@/components/ui/buttons';
import { ProgressRow } from '@/components/ui/ProgressRow';
import { Screen } from '@/components/ui/Screen';
import type { AnswerIcon, ChoiceMark } from '@/lib/types';

import styles from './PhoneQuiz.module.css';

export interface QuizChoice {
  id: string;
  label: string;
  /** The check-in's moon phases. */
  icon?: AnswerIcon;
  /** The booth quiz's neutral shapes. */
  mark?: ChoiceMark;
}

export interface QuizQuestion {
  id: string;
  note: string;
  headline: string;
  choices: QuizChoice[];
}

export interface QuizAnswer {
  questionId: string;
  choiceId: string;
}

interface PhoneQuizProps {
  questions: QuizQuestion[];
  /** Label of the button on the LAST question, e.g. "มาดูผลกัน". */
  finishLabel: string;
  /** Back from the first question leaves the flow. */
  onExit: () => void;
  /** Fires once, when the first question appears. */
  onStart?: () => void;
  /** Fires on every tap, including a changed answer. Must never block the UI. */
  onAnswer?: (answer: QuizAnswer) => void;
  /** Fires with every question answered, in order. */
  onFinish: (answers: QuizAnswer[]) => void;
}

/** BRIEF §9: a tap moves on 250ms later, so the selection is seen to land. */
const ADVANCE_MS = 250;

/**
 * One question per screen on a phone. Shared by the check-in and by the booth
 * quiz played on a student's own phone.
 *
 * Follows BRIEF §9 to the letter:
 *  - tapping an answer moves on after 250ms, so the bottom button exists only on
 *    the LAST question, where there is nothing to move on to;
 *  - each question is a real browser history entry, so the back button steps
 *    back one question rather than leaving the flow;
 *  - the question slides 24px and fades over 240ms — forward moves left, back
 *    moves right — while the progress row stays put;
 *  - focus moves to the new heading, so a screen reader or keyboard follows.
 *
 * Nothing here waits on the network. `onAnswer` and friends are fire-and-forget
 * callbacks; if they fail the student never knows (BRIEF §3).
 */
export function PhoneQuiz({
  questions,
  finishLabel,
  onExit,
  onStart,
  onAnswer,
  onFinish,
}: PhoneQuizProps) {
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState<1 | -1>(1);
  const [chosen, setChosen] = useState<Record<string, string>>({});

  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const stepRef = useRef(0);
  const started = useRef(false);
  const mounted = useRef(false);

  const last = step === questions.length - 1;
  const question = questions[step];

  // Keep a ref in step with state so the popstate handler, which is registered
  // once, always reads the current question.
  useEffect(() => {
    stepRef.current = step;
  }, [step]);

  // Browser back and forward step through the questions: each move forward adds
  // a history entry marked with its question number.
  //
  // Two things here were learned the hard way. Next.js reloads the whole page if
  // you go back to a history entry it did not create, and it only wraps
  // pushState/replaceState after it has mounted — later than this effect on a
  // direct load of the page. So:
  //  - nothing touches history on first paint;
  //  - every entry we add COPIES the current entry's state (which carries Next's
  //    own routing data) and only adds a `quiz` number to it;
  //  - the flow's first entry has no `quiz` number at all, and is recognised by
  //    the page still being this one, and counts as question 1.
  useEffect(() => {
    const flowPath = window.location.pathname;

    // Arriving by "back" from the result: this entry still carries the number of
    // the last question, but the answers are gone and we are about to show
    // question 1. Re-label it so a further back does not jump to question 7.
    const current = window.history.state as { quiz?: number } | null;
    if (current && typeof current.quiz === 'number' && current.quiz !== 0) {
      window.history.replaceState({ ...current, quiz: 0 }, '');
    }

    if (!started.current) {
      started.current = true;
      onStart?.();
    }
    const onPop = (e: PopStateEvent) => {
      const marked = (e.state as { quiz?: number } | null)?.quiz;
      // No number: this is the flow's first entry if we are still on this page,
      // and someone else's (Next.js is already handling it) if we are not.
      const target =
        typeof marked === 'number' ? marked : window.location.pathname === flowPath ? 0 : null;
      if (target === null) return;
      clearTimeout(timer.current);
      setDir(target < stepRef.current ? -1 : 1);
      setStep(Math.min(Math.max(target, 0), questions.length - 1));
    };
    window.addEventListener('popstate', onPop);
    return () => {
      window.removeEventListener('popstate', onPop);
      clearTimeout(timer.current);
    };
    // Registered once for the life of the flow. onStart is deliberately read
    // through the `started` guard, and the question count never changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Focus follows the question (§9). Not on first paint: pulling focus into the
  // page before the student has touched it would be jarring.
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    headingRef.current?.focus({ preventScroll: true });
  }, [step]);

  const advance = useCallback(
    (to: number) => {
      setDir(1);
      setStep(to);
      window.history.pushState({ ...(window.history.state as object), quiz: to }, '');
    },
    [],
  );

  const choose = (choiceId: string) => {
    // A hint of a tap where the phone supports it. Never relied on.
    navigator.vibrate?.(10);
    setChosen((prev) => ({ ...prev, [question.id]: choiceId }));
    onAnswer?.({ questionId: question.id, choiceId });
    clearTimeout(timer.current);
    if (!last) timer.current = setTimeout(() => advance(step + 1), ADVANCE_MS);
  };

  const back = () => {
    clearTimeout(timer.current);
    if (step === 0) onExit();
    else window.history.back(); // popstate does the rest
  };

  const finish = () => {
    const answers = questions.map((q) => ({ questionId: q.id, choiceId: chosen[q.id] }));
    const missing = answers.findIndex((a) => !a.choiceId);
    if (missing >= 0) {
      // Only reachable by jumping through history; send them to what they skipped.
      setDir(-1);
      setStep(missing);
      return;
    }
    onFinish(answers);
  };

  return (
    <Screen top={16}>
      <ProgressRow current={step + 1} total={questions.length} onBack={back} />

      {/* Re-keyed per question so each one slides in from the side it came. */}
      <div className={styles.slide} key={question.id} data-dir={dir}>
        <p className={styles.note}>{question.note}</p>
        <h1 className={styles.headline} tabIndex={-1} ref={headingRef}>
          {question.headline}
        </h1>

        <div className={styles.answers}>
          {question.choices.map((choice) => (
            <AnswerCard
              key={choice.id}
              label={choice.label}
              icon={choice.icon}
              mark={choice.mark}
              selected={chosen[question.id] === choice.id}
              onSelect={() => choose(choice.id)}
            />
          ))}
        </div>
      </div>

      {/* The one button in the flow: only on the last question, where there is
          nothing to auto-advance to. It is present but paper-grey until an answer
          is picked, so nothing jumps when it wakes. */}
      {last && (
        <div className={styles.footer}>
          <PrimaryAction disabled={!chosen[question.id]} onClick={finish}>
            {finishLabel}
          </PrimaryAction>
        </div>
      )}
    </Screen>
  );
}
