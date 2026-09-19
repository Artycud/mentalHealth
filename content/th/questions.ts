/**
 * The 8 check-in questions.
 *
 * Question 3 is written in BRIEF §8 and is the reference for voice. The other
 * seven are DRAFTS awaiting student-council review — marked `status: 'draft'`
 * so they can be found and signed off one by one.
 *
 * Coverage: เรียน ×1, ความกดดัน ×1, การพักผ่อน ×2, เพื่อน ×1, ครอบครัว ×1,
 * เวลาว่าง ×1, ความรู้สึกโดยรวม ×1. Rest gets two because sleep and end-of-day
 * energy are different things and both feed the reference result.
 *
 * Choices always run a → d from lightest to heaviest (weight 0 → 3) and always
 * use the moon phases full → half → crescent → empty, so the icon is a quiet
 * cue and never a colour signal.
 *
 * Voice (§10, §16): how a CUD student talks to a friend. Short and plain. No
 * wellness-app phrasing, no corporate UX words. Nothing here diagnoses.
 *
 * Note for review: question 5 (family) is the most sensitive. Its heaviest
 * option is worded to describe a feeling, not to accuse anyone at home.
 */

import type { Question, Topic } from '@/lib/types';

/** Thai labels for the result pills (§8). */
export const topicLabels: Record<Topic, string> = {
  study: 'เรื่องเรียน',
  rest: 'การพักผ่อน',
  friends: 'เพื่อน',
  family: 'ครอบครัว',
  freetime: 'เวลาว่าง',
  pressure: 'ความกดดัน',
  overall: 'ความรู้สึกโดยรวม',
};

/** The note above every question headline (§8). */
export const questionNote = 'เลือกอันที่ใกล้เคียงกับคุณที่สุด';

export const questions: Question[] = [
  {
    id: 'q1-study',
    topic: 'study',
    status: 'draft',
    headline: 'เรื่องเรียนช่วงนี้เป็นยังไงบ้าง?',
    choices: [
      { id: 'a', label: 'ตามทัน สบายใจ', topic: 'study', weight: 0, icon: 'full' },
      { id: 'b', label: 'มีบางวิชาที่เริ่มตามไม่ทัน', topic: 'study', weight: 1, icon: 'half' },
      { id: 'c', label: 'การบ้านกับงานกลุ่มเยอะจนล้น', topic: 'study', weight: 2, icon: 'crescent' },
      { id: 'd', label: 'ไม่อยากเปิดหนังสือเลย', topic: 'study', weight: 3, icon: 'empty' },
    ],
  },
  {
    id: 'q2-pressure',
    topic: 'pressure',
    status: 'draft',
    headline: 'มีอะไรที่รู้สึกกดดันอยู่ไหม?',
    choices: [
      { id: 'a', label: 'ไม่ค่อยมี', topic: 'pressure', weight: 0, icon: 'full' },
      { id: 'b', label: 'มีบ้าง แต่ยังไหว', topic: 'pressure', weight: 1, icon: 'half' },
      { id: 'c', label: 'มีหลายเรื่องพร้อมกัน', topic: 'pressure', weight: 2, icon: 'crescent' },
      { id: 'd', label: 'รู้สึกว่าแบกไว้เยอะเกินไป', topic: 'pressure', weight: 3, icon: 'empty' },
    ],
  },
  {
    // Reference question, verbatim from BRIEF §8. Choice c is filed under
    // `study`: staying up late *because of workload* is a study signal that
    // happens to surface in a sleep question.
    id: 'q3-sleep',
    topic: 'rest',
    status: 'reference',
    headline: 'ช่วงนี้นอนหลับเป็นยังไงบ้าง?',
    choices: [
      { id: 'a', label: 'หลับสบายดี', topic: 'rest', weight: 0, icon: 'full' },
      { id: 'b', label: 'หลับบ้าง ไม่หลับบ้าง', topic: 'rest', weight: 1, icon: 'half' },
      { id: 'c', label: 'นอนดึกเพราะงานเยอะ', topic: 'study', weight: 2, icon: 'crescent' },
      { id: 'd', label: 'นอนไม่ค่อยหลับ', topic: 'rest', weight: 3, icon: 'empty' },
    ],
  },
  {
    id: 'q4-friends',
    topic: 'friends',
    status: 'draft',
    headline: 'เวลาอยู่กับเพื่อน ๆ ช่วงนี้เป็นยังไง?',
    choices: [
      { id: 'a', label: 'สนุกดี', topic: 'friends', weight: 0, icon: 'full' },
      { id: 'b', label: 'โอเค แต่บางวันไม่อยากคุยกับใคร', topic: 'friends', weight: 1, icon: 'half' },
      { id: 'c', label: 'รู้สึกห่างจากเพื่อนนิดหน่อย', topic: 'friends', weight: 2, icon: 'crescent' },
      { id: 'd', label: 'รู้สึกเหมือนอยู่คนเดียว', topic: 'friends', weight: 3, icon: 'empty' },
    ],
  },
  {
    id: 'q5-family',
    topic: 'family',
    status: 'draft',
    headline: 'ที่บ้านช่วงนี้เป็นยังไงบ้าง?',
    choices: [
      { id: 'a', label: 'สบายใจ คุยกันได้', topic: 'family', weight: 0, icon: 'full' },
      { id: 'b', label: 'เฉย ๆ ไม่ค่อยได้คุยกัน', topic: 'family', weight: 1, icon: 'half' },
      { id: 'c', label: 'มีเรื่องให้เครียดอยู่บ้าง', topic: 'family', weight: 2, icon: 'crescent' },
      { id: 'd', label: 'กลับบ้านแล้วไม่ค่อยสบายใจ', topic: 'family', weight: 3, icon: 'empty' },
    ],
  },
  {
    id: 'q6-freetime',
    topic: 'freetime',
    status: 'draft',
    headline: 'ช่วงนี้ได้ทำอะไรที่ชอบบ้างไหม?',
    choices: [
      { id: 'a', label: 'ได้ทำเป็นประจำ', topic: 'freetime', weight: 0, icon: 'full' },
      { id: 'b', label: 'ได้ทำบ้างนาน ๆ ที', topic: 'freetime', weight: 1, icon: 'half' },
      { id: 'c', label: 'แทบไม่มีเวลาเลย', topic: 'freetime', weight: 2, icon: 'crescent' },
      { id: 'd', label: 'มีเวลา แต่ไม่อยากทำอะไร', topic: 'freetime', weight: 3, icon: 'empty' },
    ],
  },
  {
    id: 'q7-energy',
    topic: 'rest',
    status: 'draft',
    headline: 'พอเลิกเรียนแล้ว เหลือแรงแค่ไหน?',
    choices: [
      { id: 'a', label: 'ยังมีแรงทำอย่างอื่นต่อ', topic: 'rest', weight: 0, icon: 'full' },
      { id: 'b', label: 'เหนื่อยนิดหน่อย', topic: 'rest', weight: 1, icon: 'half' },
      { id: 'c', label: 'เหนื่อยจนอยากนอนเลย', topic: 'rest', weight: 2, icon: 'crescent' },
      { id: 'd', label: 'หมดแรง ทำอะไรไม่ไหว', topic: 'rest', weight: 3, icon: 'empty' },
    ],
  },
  {
    id: 'q8-overall',
    topic: 'overall',
    status: 'draft',
    headline: 'สัปดาห์ที่ผ่านมา รู้สึกยังไงบ้าง?',
    choices: [
      { id: 'a', label: 'ค่อนข้างดี', topic: 'overall', weight: 0, icon: 'full' },
      { id: 'b', label: 'ปกติ ๆ', topic: 'overall', weight: 1, icon: 'half' },
      { id: 'c', label: 'ค่อนข้างเหนื่อย', topic: 'overall', weight: 2, icon: 'crescent' },
      { id: 'd', label: 'หนักอยู่เหมือนกัน', topic: 'overall', weight: 3, icon: 'empty' },
    ],
  },
];

/** The reference question the static check-in screen shows (3 of 8). */
export const referenceQuestionIndex = 2;
