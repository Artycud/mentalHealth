/**
 * The result phrase library.
 *
 * Every sentence and suggestion here is written ahead of time. The result for a
 * set of answers is assembled from these parts by buildResult(); nothing is
 * generated at runtime and an AI model is never called inside the product
 * (BRIEF §8, §15).
 *
 * How it is assembled, and why. The brief keys the library by state + primary
 * topic + secondary topic, which is 4 × 7 × 6 = 168 combinations. Writing 168
 * bespoke results would mean a council review nobody could finish, so the same
 * idea is built from parts instead:
 *   headline    one per state
 *   body        one template per state, naming the two topics
 *   suggestions the primary topic's first two, then the secondary topic's first
 * which reproduces the brief's reference result exactly (drained · study · rest).
 *
 * ALL OF THIS COPY IS A DRAFT awaiting student-council review, except the
 * reference result, which is written in BRIEF §8. Voice (§10): a friend, short
 * and practical, never wellness-app talk.
 *
 * Safety (§12): the site never diagnoses anyone and never tells a student they
 * are fine, so the calmest result still says "ดูเหมือน" and still carries the
 * route to CUD Care. In the heaviest state one suggestion is always to talk to
 * someone, whatever the topics were.
 *
 * Imports are relative with `.ts` so scripts/test-scoring.mjs can load this file
 * in plain Node.
 */

import type { CheckinResult } from '../../lib/scoring.ts';
import type { ResultState, Topic } from '../../lib/types';
import { topicLabels } from './questions.ts';

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
 * The sentence naming the two strongest topics. It points at the actual
 * answers, as §10 asks. The `drained` one is written in BRIEF §8; the other
 * three follow its shape.
 */
export function resultBody(state: ResultState, primary: Topic, secondary: Topic): string {
  const p = topicLabels[primary];
  const s = topicLabels[secondary];
  switch (state) {
    case 'ok':
      return `จากคำตอบเมื่อกี้ ดูเหมือนช่วงนี้ไม่ได้หนักมาก ถ้าจะมีอะไรให้คิดต่อ ก็คงเป็น${p}กับ${s}`;
    case 'thinking':
      return `จากคำตอบเมื่อกี้ ${p}ดูจะเป็นเรื่องที่คิดอยู่มากที่สุด และ${s}ก็มีส่วนอยู่บ้าง`;
    case 'drained':
      return `จากคำตอบเมื่อกี้ ${p}ดูจะเด่นที่สุด และ${s}ก็น่าจะมีส่วนเหมือนกัน`;
    case 'heavy':
      return `จากคำตอบเมื่อกี้ ${p}ดูจะหนักที่สุด และ${s}ก็น่าจะมีส่วนด้วย`;
  }
}

/**
 * Three small things to try per topic, in order of how easy they are. Practical
 * and low-stakes, never "you should", and never medical.
 */
const SUGGESTIONS: Record<Topic, [Suggestion, Suggestion, Suggestion]> = {
  study: [
    // The first two are the brief's reference suggestions (§8).
    {
      title: 'แบ่งงานเป็นชิ้นเล็ก ๆ',
      body: 'ทำให้เสร็จทีละชิ้น ดีกว่ามองทุกอย่างพร้อมกันแล้วไม่รู้จะเริ่มตรงไหน',
    },
    { title: 'หาเวลาพักจริง ๆ สักช่วง', body: 'ปิดแชตกลุ่มงานไปก่อนสัก 15 นาทีก็ยังดี' },
    { title: 'ถามคนที่พอช่วยได้', body: 'เพื่อนหรือครูที่รู้เรื่องนั้น ถามแค่ข้อเดียวก็ช่วยได้เยอะ' },
  ],
  rest: [
    // The first is the brief's reference suggestion (§8).
    { title: 'ลองเข้านอนเร็วขึ้นอีกนิด', body: 'เริ่มจากคืนนี้คืนเดียวก่อนก็ได้' },
    { title: 'วางโทรศัพท์ก่อนนอนสักหน่อย', body: 'ห่างจอสัก 15 นาที ให้ตากับหัวได้พัก' },
    { title: 'พักสั้น ๆ ระหว่างวัน', body: 'ยืดตัว ดื่มน้ำ หรือเดินสักรอบ แค่ห้านาทีก็พอ' },
  ],
  friends: [
    { title: 'ทักหาเพื่อนสักคน', body: 'คนที่อยู่ด้วยแล้วสบายใจ ไม่ต้องคุยเรื่องหนัก ๆ ก็ได้' },
    { title: 'ไปกินข้าวด้วยกัน', body: 'นั่งด้วยกันเฉย ๆ ก็นับ ไม่ต้องมีอะไรให้พูดเยอะ' },
    { title: 'เริ่มจากเรื่องเล็ก ๆ', body: 'เรื่องเพลง หรือกินอะไรดี ก็เป็นจุดเริ่มคุยได้' },
  ],
  family: [
    { title: 'เล่าให้ที่บ้านฟังสั้น ๆ', body: 'แค่บอกว่าวันนี้เป็นยังไง ไม่ต้องอธิบายทุกอย่าง' },
    { title: 'หาช่วงอยู่ด้วยกันแบบสบาย ๆ', body: 'กินข้าวหรือดูอะไรด้วยกัน โดยไม่ต้องคุยเรื่องเรียน' },
    { title: 'เขียนสิ่งที่อยากบอกไว้ก่อน', body: 'ถ้าพูดไม่ออก เขียนใส่กระดาษก่อนก็ช่วยเรียบเรียงได้' },
  ],
  freetime: [
    { title: 'กันเวลาให้สิ่งที่ชอบสัก 20 นาที', body: 'เพลง วาดรูป หรือเล่นเกม อะไรก็ได้ที่ทำแล้วเพลิน' },
    { title: 'ลองอะไรเล็ก ๆ ที่ไม่เกี่ยวกับเรียน', body: 'เดินเล่น ทำขนม หรือดูคลิปที่ชอบ' },
    { title: 'จดไว้ว่าอยากทำอะไร', body: 'พอมีเวลาว่างจะได้ไม่ต้องนึกใหม่' },
  ],
  pressure: [
    { title: 'จดเรื่องที่กังวลลงกระดาษ', body: 'พอเห็นเป็นตัวหนังสือ บางเรื่องก็เล็กลง' },
    { title: 'เลือกมาทำแค่เรื่องเดียวก่อน', body: 'ที่เหลือค่อยไล่ไปทีหลัง' },
    { title: 'หายใจช้า ๆ สักสามรอบ', body: 'ยาว ๆ เข้า ยาว ๆ ออก ก่อนเริ่มเรื่องต่อไป' },
  ],
  overall: [
    { title: 'ให้เวลากับตัวเองสักหน่อย', body: 'วันนี้ไม่ต้องเก่งทุกเรื่องก็ได้' },
    { title: 'ทำอะไรง่าย ๆ ที่ชอบ', body: 'เพลงโปรด ของกินที่ชอบ หรืออาบน้ำอุ่น ๆ' },
    { title: 'ลองเล่าให้ใครสักคนฟัง', body: 'เพื่อนหรือคนที่ไว้ใจ เล่าแค่ที่อยากเล่าก็พอ' },
  ],
};

/**
 * In the heaviest state the third suggestion is this, whatever the topics were.
 * It never waits for things to get worse first: that is the point of the wording.
 */
const TALK: Suggestion = {
  title: 'ลองคุยกับใครสักคน',
  body: 'เพื่อน ครู หรือ CUD Care ก็ได้ ไม่ต้องรอให้หนักกว่านี้',
};

export interface BuiltResult {
  headline: string;
  body: string;
  primaryLabel: string;
  secondaryLabel: string;
  /** Exactly three. Never numbered — they are not steps (§7). */
  suggestions: [Suggestion, Suggestion, Suggestion];
}

/** Assemble the result for a scored check-in from the parts above. */
export function buildResult(r: Pick<CheckinResult, 'state' | 'primary' | 'secondary'>): BuiltResult {
  const [p0, p1] = SUGGESTIONS[r.primary];
  const [s0] = SUGGESTIONS[r.secondary];
  return {
    headline: stateHeadlines[r.state],
    body: resultBody(r.state, r.primary, r.secondary),
    primaryLabel: topicLabels[r.primary],
    secondaryLabel: topicLabels[r.secondary],
    suggestions: [p0, p1, r.state === 'heavy' ? TALK : s0],
  };
}

/** For the test: every suggestion in the library, so it can be checked in bulk. */
export const allSuggestions = (): Suggestion[] => [...Object.values(SUGGESTIONS).flat(), TALK];
