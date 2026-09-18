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
 * PHASE 2 holds the one reference result from the brief; PHASE 3 fills the
 * library and the scoring that picks from it.
 */

import type { ResultState, Topic } from '@/lib/types';

export interface Suggestion {
  title: string;
  body: string;
}

/** The heading above the suggestion rows (§8). */
export const suggestionsHeading = 'ลองดูอันนี้';

/** The Itim note in the result header (§8). */
export const doneNote = 'เสร็จแล้ว';

/** Headline per band (§8). */
export const stateHeadlines: Record<ResultState, string> = {
  ok: 'ช่วงนี้ค่อนข้างโอเค',
  thinking: 'มีอะไรให้คิดอยู่บ้าง',
  drained: 'ช่วงนี้ใช้พลังงานไปเยอะ',
  heavy: 'ช่วงนี้น่าจะหนักอยู่เหมือนกัน',
};

/**
 * The reference result, verbatim from BRIEF §8, for the answer set that
 * produces it: study primary, rest secondary, in the "drained" band.
 */
export const referenceResult: {
  state: ResultState;
  primary: Topic;
  secondary: Topic;
  body: string;
  suggestions: [Suggestion, Suggestion, Suggestion];
} = {
  state: 'drained',
  primary: 'study',
  secondary: 'rest',
  body: 'จากคำตอบเมื่อกี้ เรื่องเรียนดูจะเด่นที่สุด และการพักผ่อนก็น่าจะมีส่วนเหมือนกัน',
  suggestions: [
    {
      title: 'แบ่งงานเป็นชิ้นเล็ก ๆ',
      body: 'ทำให้เสร็จทีละชิ้น ดีกว่ามองทุกอย่างพร้อมกันแล้วไม่รู้จะเริ่มตรงไหน',
    },
    {
      title: 'หาเวลาพักจริง ๆ สักช่วง',
      body: 'ปิดแชตกลุ่มงานไปก่อนสัก 15 นาทีก็ยังดี',
    },
    {
      title: 'ลองเข้านอนเร็วขึ้นอีกนิด',
      body: 'เริ่มจากคืนนี้คืนเดียวก่อนก็ได้',
    },
  ],
};

// TODO(phase 3): phrase library keyed by `${state}:${primary}:${secondary}`.
