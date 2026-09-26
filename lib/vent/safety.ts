/**
 * The deterministic safety net for VENT. It runs on the server BEFORE any AI is
 * asked, so a message that may mean danger always gets the same reviewed answer
 * (content/th/vent.ts `care`), whatever the model would have said. The model's
 * own `risk` field is a second net, never the only one.
 *
 * It errs toward care on purpose: a student writing "อยากตาย การบ้านเยอะ" as a
 * joke still sees a warm screen that lets them keep talking, which costs little;
 * missing a real one costs far more.
 *
 * THE LIST NEEDS CUD CARE'S REVIEW, and should grow with the slang students use.
 */

/** Written without spaces: Thai is matched against the message with its spaces removed. */
const THAI = [
  // self-harm and suicide
  'อยากตาย', 'ไม่อยากอยู่แล้ว', 'ไม่อยากมีชีวิต', 'ไม่อยากอยู่บนโลก', 'ไม่อยากตื่นขึ้นมา',
  'ฆ่าตัวตาย', 'ฆ่าตัวเอง', 'จบชีวิต', 'ปลิดชีพ', 'ทำร้ายตัวเอง', 'กรีดแขน', 'กรีดข้อมือ',
  'กรีดตัวเอง', 'กินยาเกินขนาด', 'กินยาตาย', 'โดดตึก', 'กระโดดตึก', 'แขวนคอ', 'ตายไปซะ',
  'หายไปจากโลก', 'อยู่ไปก็ไร้ค่า', 'ไม่มีใครต้องการเรา', 'ลาก่อนทุกคน',
  // being harmed
  'โดนทำร้าย', 'ถูกทำร้าย', 'โดนตี', 'ถูกตี', 'โดนซ้อม', 'ถูกซ้อม', 'โดนล่วงละเมิด',
  'ถูกล่วงละเมิด', 'โดนลวนลาม', 'ถูกลวนลาม', 'โดนข่มขืน', 'ถูกข่มขืน', 'โดนขู่',
];

const ENGLISH = /\b(kill (my ?self|me)|suicid\w*|self[- ]?harm\w*|want(ed)? to die|wanna die|end (it all|my life)|cut(ting)? myself|overdose|unalive|abuse[ds]?|raped?|molest\w*)\b/i;

/** Lower-case, and without spaces, zero-width characters or repeated letters' spacing. */
function squash(text: string): string {
  return text.normalize('NFC').toLowerCase().replace(/[\s​-‍﻿]+/g, '');
}

/** True when a message may mean the student, or someone, is in danger. */
export function needsCare(text: string): boolean {
  const flat = squash(text);
  return THAI.some((phrase) => flat.includes(phrase)) || ENGLISH.test(text);
}
