/**
 * The 8 check-in questions.
 *
 * PHASE 2 fills this. Question 3 is written for us in BRIEF §8 and is the
 * reference; the other 7 get drafted in the same voice across the topics
 * เรียน / การพักผ่อน / เพื่อน / ครอบครัว / เวลาว่าง / ความกดดัน / ความรู้สึกโดยรวม,
 * and must be marked as drafts awaiting student-council review.
 *
 * Voice check (§10, §16): would a CUD student believe another student wrote
 * this? No wellness-app phrasing, no corporate UX words.
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

// TODO(phase 2): all 8 questions. Mark items 1–2 and 4–8 as
// "DRAFT — awaiting council review".
export const questions: Question[] = [];
