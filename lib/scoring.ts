/**
 * Check-in scoring (BRIEF §8), used by the phone to show a result and by the
 * server to recompute it from the stored answers, so the client can never post
 * a result of its own (§3).
 *
 * Imports are relative and carry their `.ts` extension so this file, and the
 * content it reads, can also be loaded by plain Node in scripts/test-scoring.mjs.
 *
 * Deterministic and pure: the same answers always give the same result. Never an
 * AI model, and never anything that varies at runtime (§8, §15).
 */

import { questions } from '../content/th/questions.ts';
import type { ResultState, Topic } from './types';

export interface CheckinAnswer {
  questionId: string;
  choiceId: string;
}

export interface CheckinResult {
  state: ResultState;
  /** The strongest topic. */
  primary: Topic;
  /** The second strongest. Always a different topic. */
  secondary: Topic;
  total: number;
  /** The highest total the answered questions could have produced. */
  max: number;
}

/**
 * Bands, as a share of the highest possible total (§8):
 *   under 30%  → ok        30–55% → thinking
 *   55–78%     → drained   above 78% → heavy
 * With 8 questions worth up to 3 each, the highest total is 24, and no whole
 * total lands exactly on a boundary (7.2, 13.2, 18.72), so the edges never
 * need a tie-break.
 */
export function stateFor(total: number, max: number): ResultState {
  const share = max === 0 ? 0 : total / max;
  if (share < 0.3) return 'ok';
  if (share < 0.55) return 'thinking';
  if (share <= 0.78) return 'drained';
  return 'heavy';
}

/**
 * Score a complete set of answers. Returns null unless every question has been
 * answered exactly once with a choice that exists — the server relies on that to
 * refuse a completion built from anything else.
 */
export function scoreCheckin(answers: CheckinAnswer[]): CheckinResult | null {
  const byQuestion = new Map<string, string>();
  for (const a of answers) {
    if (byQuestion.has(a.questionId)) return null; // answered twice
    byQuestion.set(a.questionId, a.choiceId);
  }
  if (byQuestion.size !== questions.length) return null;

  const totals = new Map<Topic, number>();
  const firstSeen = new Map<Topic, number>();
  let total = 0;
  let max = 0;

  for (let i = 0; i < questions.length; i += 1) {
    const question = questions[i];
    const choiceId = byQuestion.get(question.id);
    const choice = question.choices.find((c) => c.id === choiceId);
    if (!choice) return null; // unknown question or choice
    total += choice.weight;
    max += Math.max(...question.choices.map((c) => c.weight));
    // A choice counts toward ITS OWN topic, which is not always the question's:
    // "นอนดึกเพราะงานเยอะ" sits in a sleep question but is about study.
    totals.set(choice.topic, (totals.get(choice.topic) ?? 0) + choice.weight);
    if (!firstSeen.has(choice.topic)) firstSeen.set(choice.topic, i);
  }

  // Highest total first; a tie goes to the topic that showed up earliest in the
  // question order (§8).
  const ranked = [...totals.keys()].sort(
    (a, b) => totals.get(b)! - totals.get(a)! || firstSeen.get(a)! - firstSeen.get(b)!,
  );

  return {
    state: stateFor(total, max),
    primary: ranked[0],
    secondary: ranked[1],
    total,
    max,
  };
}
