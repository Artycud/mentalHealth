/**
 * Scoring for "รู้จักตัวเองอีกนิด" (content/th/mbti.ts): each answer is one vote
 * for one end of its side; the end with more votes (of 3, so never a tie) is that
 * side's letter, and how many votes it got says how clear it was.
 */

import { mbtiQuestions, type Axis, type Pole } from '../content/th/mbti.ts';

export const AXES: readonly Axis[] = ['EI', 'SN', 'TF', 'JP'];

export interface Side {
  axis: Axis;
  /** The end the answers lean to. */
  pole: Pole;
  /** Votes for that end, out of `of`. */
  votes: number;
  of: number;
}

export interface MbtiResult {
  /** e.g. 'INFP' */
  type: string;
  sides: Side[];
}

/** `answers[i]` is the pole chosen for question i. Undefined until all are answered. */
export function scoreMbti(answers: readonly (Pole | undefined)[]): MbtiResult | undefined {
  if (answers.length !== mbtiQuestions.length || answers.some((a) => !a)) return undefined;
  const sides = AXES.map((axis): Side => {
    const [a, b] = axis.split('') as [Pole, Pole];
    const mine = mbtiQuestions.map((q, i) => (q.axis === axis ? answers[i] : undefined)).filter(Boolean);
    const forA = mine.filter((p) => p === a).length;
    const forB = mine.length - forA;
    return forA > forB ? { axis, pole: a, votes: forA, of: mine.length } : { axis, pole: b, votes: forB, of: mine.length };
  });
  return { type: sides.map((s) => s.pole).join(''), sides };
}
