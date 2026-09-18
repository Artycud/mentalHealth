/**
 * The result phrase library.
 *
 * Every sentence and suggestion is written and reviewed ahead of time, keyed by
 * state + primaryTopic + secondaryTopic. Result text is NEVER generated at
 * runtime and an AI model is never called inside the product (BRIEF §8, §15).
 *
 * Safety (§12): the site never diagnoses anyone and never tells a student they
 * are fine. Every result keeps a visible route to CUD Care.
 *
 * PHASE 2 adds the one reference result below; PHASE 3 fills the library.
 */

import type { ResultState } from '@/lib/types';

export interface Suggestion {
  title: string;
  body: string;
}

export interface ResultCopy {
  headline: string;
  body: string;
  /** Exactly three. Never numbered — they are not steps (§7). */
  suggestions: [Suggestion, Suggestion, Suggestion];
}

/** The heading above the suggestion rows (§8). */
export const suggestionsHeading = 'ลองดูอันนี้';

/** The Itim note in the result header (§8). */
export const doneNote = 'เสร็จแล้ว';

/** Headline per band. Drives the reference result until the library exists. */
export const stateHeadlines: Record<ResultState, string> = {
  ok: 'ช่วงนี้ค่อนข้างโอเค',
  thinking: 'มีอะไรให้คิดอยู่บ้าง',
  drained: 'ช่วงนี้ใช้พลังงานไปเยอะ',
  heavy: 'ช่วงนี้น่าจะหนักอยู่เหมือนกัน',
};

// TODO(phase 3): phrase library keyed by `${state}:${primary}:${secondary}`.
