/**
 * Festival themes for booth mode.
 *
 * Dates, times, place and activities come from the approved project document
 * (โครงการ CUD Mental Health Week). All three booths run 11.10–12.50 น. in
 * โถงโรงอาหาร.
 *
 * NOTE — two dates to confirm with the council. The document's schedule section
 * and its Gantt table disagree:
 *   ลอยกระทง          schedule 19–20 พ.ย. 2569   · Gantt 19–24 พ.ย. 2569
 *   ตรุษจีน & วาเลนไทน์  schedule 10–11 ก.พ. 2570   · Gantt 10–12 ก.พ. 2570
 * The schedule section is used here because it also carries the time and place.
 * คริสต์มาส agrees in both (8–9 ธ.ค. 2569).
 *
 * Only one festival is active at a time and the admin panel chooses it (§8).
 * A theme changes ONLY four things: the accent colour that replaces sunflower,
 * the small home festival icon, the booth illustration, and the booth copy and
 * result set. Paper, ink, pink, blue, typography, components, spacing and
 * motion are identical across every festival. A theme must never introduce a
 * new font, a gradient, or snow or heart animations.
 */

import type { FestivalId, Tint } from '@/lib/types';

import { eventFacts } from './common';

export interface FestivalTheme {
  id: FestivalId;
  name: string;
  /** Replaces --sunflower. The only colour a theme may swap. */
  accent: string;
  /** e.g. "19–20 พ.ย. 2569". */
  date: string;
  /** The wellbeing theme this booth carries, from the project document. */
  theme: string;
  /** False until the festival has a quiz and results written. */
  ready: boolean;
  home?: { blurb: string };
  ticket?: {
    label: string;
    resultNote: string;
    title: string;
    body: string;
    where: string;
  };
}

export const festivals: Record<FestivalId, FestivalTheme> = {
  loykrathong: {
    id: 'loykrathong',
    name: 'ลอยกระทง',
    accent: '#FFB511',
    date: '19–20 พ.ย. 2569',
    theme: 'การปล่อยวางความทุกข์ และการจัดการความรู้สึกเชิงลบ',
    ready: true,
    home: {
      blurb: 'ตอบคำถามสั้น ๆ แล้วเอาผลไปรับดอกไม้มาแต่งกระทงที่บูธ',
    },
    ticket: {
      label: 'บูธลอยกระทง',
      resultNote: 'ดอกไม้ของคุณคือ',
      title: 'เอาหน้านี้ไปโชว์ที่บูธ',
      body: 'รับดอกดาวเรืองไปแต่งกระทงของคุณได้เลย',
      where: `ที่${eventFacts.boothPlace} 19–20 พ.ย. 2569`,
    },
  },
  christmas: {
    id: 'christmas',
    name: 'คริสต์มาส',
    accent: '#FFB511', // TODO: awaiting council — placeholder accent
    date: '8–9 ธ.ค. 2569',
    theme: 'การสร้างความหวังในชีวิต และการจัดการความรู้สึกเมื่อเกิดความผิดหวัง',
    ready: false,
    // TODO: awaiting council content. Booth activities are known from the
    // project document (เขียนขอพรใส่ถุงเท้า, ตกแต่งต้นคริสต์มาส, พับกระดาษเป็น
    // ต้นคริสต์มาส) but the quiz and its results are not written yet.
  },
  'cny-valentine': {
    id: 'cny-valentine',
    name: 'ตรุษจีน & วาเลนไทน์',
    accent: '#FFB511', // TODO: awaiting council — placeholder accent
    date: '10–11 ก.พ. 2570',
    theme: 'การให้ความรู้สึกรัก และการปรับตัวให้เข้ากับทุกรูปแบบความสัมพันธ์',
    ready: false,
    // TODO: awaiting council content. Activities known (บูธขายสินค้า,
    // มุมรวมคนอกหัก, เขียนคำอวยพรใส่ซองตรุษจีน); quiz and results are not.
  },
};

/** Order of the festivals, which also fixes the order of the next-booth pills. */
export const festivalOrder: FestivalId[] = ['loykrathong', 'christmas', 'cny-valentine'];

/** The booth quiz's own title, as the project document names it. */
export const boothQuizTitle = 'คุณเป็นดอกไม้แบบไหน?';

/**
 * Loy Krathong flower results.
 *
 * The six the booth actually stocks, given by the student council. ดาวเรือง's
 * body line is written in BRIEF §8. The other five are DRAFTS awaiting council
 * review: each is built on one plainly true thing about the flower (the
 * meaning of its name, its scent, how long it lasts) rather than an invented
 * trait, then closed with the same "เหมือนคำตอบเมื่อกี้" hook so it points at
 * the student's actual answers (§10). Order and names may still change before
 * the booth — the council said so directly — so nothing else in the codebase
 * should assume this order or count beyond `loykrathongFlowers.length` and
 * lookup-by-`id`.
 */
export interface Flower {
  id: string;
  name: string;
  body: string;
  /** False while the name is a placeholder rather than a real flower. */
  named: boolean;
  /**
   * Ink pairing for the interim rosette (components/booth/WallFlower.tsx), picked
   * so it does not contradict the flower's real colour: the palette has only
   * pink, blue and the festival yellow, so this is as close as it gets. It goes
   * away for a flower once that flower has its own illustration.
   */
  tint: Tint;
}

export const loykrathongFlowers: Flower[] = [
  {
    id: 'lotus',
    tint: 3, // pink with a yellow centre, like the real thing
    name: 'ดอกบัว',
    body: 'ขึ้นจากโคลนแต่ยังสะอาด เหมือนคำตอบเมื่อกี้ของคุณเลย',
    named: true,
  },
  {
    id: 'crown-flower',
    tint: 5, // blue over pink reads as the lilac of the common variety
    name: 'ดอกรัก',
    body: 'ชื่อแปลว่ารักตรง ๆ เลย เหมือนคำตอบเมื่อกี้ของคุณเลย',
    named: true,
  },
  {
    id: 'globe-amaranth',
    tint: 1, // magenta-purple, the usual colour of the globe
    name: 'ดอกบานไม่รู้โรย',
    body: 'เก็บไว้นานแค่ไหนก็ยังสีเดิม เหมือนคำตอบเมื่อกี้ของคุณเลย',
    named: true,
  },
  {
    // BRIEF §8's written reference flower — id stays 'marigold' so
    // app/(student)/booth/page.tsx can find it by id regardless of order.
    id: 'marigold',
    tint: 0, // the yellow-and-orange of the hand-drawn marigold
    name: 'ดาวเรือง',
    body: 'สีสด ทนแดด อยู่ได้นาน เหมือนคำตอบเมื่อกี้ของคุณเลย',
    named: true,
  },
  {
    id: 'orchid',
    tint: 2,
    name: 'กล้วยไม้',
    body: 'บานอยู่ได้นานกว่าดอกไม้ทั่วไป เหมือนคำตอบเมื่อกี้ของคุณเลย',
    named: true,
  },
  {
    id: 'champak',
    tint: 4, // yellow-orange, as champak is
    name: 'จำปี',
    body: 'หอมไกลจนได้กลิ่นก่อนเห็นดอก เหมือนคำตอบเมื่อกี้ของคุณเลย',
    named: true,
  },
];

/**
 * The 3-question booth quiz. DRAFT — awaiting council review.
 *
 * Lighter than the check-in: this is a game in a queue at a noisy canteen, not
 * a wellbeing check. It still carries the booth's theme (ปล่อยวางความทุกข์)
 * but never asks anything a student would mind answering with people watching
 * over their shoulder, which rules out the check-in's register entirely.
 *
 * Each choice adds points; the total, modulo the number of flowers, picks the
 * result. It is deterministic and recomputable on the server (§3).
 *
 * Why a sum and not "most votes wins": with three answers and six flowers a
 * plurality is a full three-way split for 62.5% of students, so the first
 * answer would decide their flower and questions 2 and 3 would be decoration.
 * Worse, กล้วยไม้ and จำปี could only win on a genuine match — 6% each against
 * 22% for the others — and this booth hands out PHYSICAL flowers, so it would
 * run out of four kinds and be left holding a pile of two. Summing uses all
 * three answers and lands every flower between 14% and 19% (ideal 16.7%).
 * Verified by enumerating all 64 answer combinations, not estimated.
 *
 * The points below (Q1 0–3, Q2 {4,5,0,1}, Q3 {2,3,4,5}) are what produce that
 * spread. Re-check the distribution before changing any of them.
 */
export interface BoothChoice {
  id: string;
  label: string;
  /** Added to the running total. See the note above before changing. */
  points: number;
}

export interface BoothQuestion {
  id: string;
  headline: string;
  note: string;
  choices: BoothChoice[];
}

export const loykrathongQuiz: BoothQuestion[] = [
  {
    id: 'b1',
    note: 'เลือกอันที่ใช่ที่สุด',
    headline: 'ถ้าลอยอะไรทิ้งไปได้สักอย่าง จะลอยอะไร?',
    choices: [
      { id: 'a', label: 'เรื่องที่คิดมากเกินไป', points: 0 },
      { id: 'b', label: 'ความเหนื่อยที่สะสมไว้', points: 1 },
      { id: 'c', label: 'เรื่องที่ยังปล่อยไม่ได้', points: 2 },
      { id: 'd', label: 'ไม่มีอะไรอยากทิ้ง', points: 3 },
    ],
  },
  {
    id: 'b2',
    note: 'ตอบเร็ว ๆ ได้เลย',
    headline: 'กระทงของคุณหน้าตาเป็นยังไง?',
    choices: [
      { id: 'a', label: 'เรียบ ๆ แต่ดูดี', points: 4 },
      { id: 'b', label: 'แต่งเต็มที่ สีจัดเต็ม', points: 5 },
      { id: 'c', label: 'ทำเอง ไม่เหมือนใคร', points: 0 },
      { id: 'd', label: 'ขอแบบง่าย ๆ เร็ว ๆ', points: 1 },
    ],
  },
  {
    id: 'b3',
    note: 'ข้อสุดท้ายแล้ว',
    headline: 'ลอยกระทงเสร็จแล้วอยากทำอะไรต่อ?',
    choices: [
      { id: 'a', label: 'ยืนดูน้ำเงียบ ๆ', points: 2 },
      { id: 'b', label: 'ถ่ายรูปกับเพื่อน', points: 3 },
      { id: 'c', label: 'เดินกินของในงาน', points: 4 },
      { id: 'd', label: 'กลับบ้านไปนอน', points: 5 },
    ],
  },
];

/** Copy for the kiosk, which is read standing up by a queue. */
export const kiosk = {
  idleTitle: 'คุณเป็นดอกไม้แบบไหน?',
  idleBody: 'ตอบ 3 ข้อ แล้วรับดอกไม้ไปแต่งกระทง',
  idleAction: 'เริ่มเลย',
  resultNote: 'ดอกไม้ของคุณคือ',
  ticketTitle: 'รับดอกไม้ที่บูธได้เลย',
  ticketBody: 'บอกชื่อดอกไม้นี้กับพี่ ๆ ที่บูธ',
  again: 'เล่นอีกครั้ง',
  /** Seconds of inactivity on the result before it resets for the next student. */
  resetSeconds: 20,
  resetHint: 'จะกลับหน้าแรกใน',
} as const;

/**
 * The flower for a set of answers: total points, modulo the number of flowers.
 * Sized from the flower list, so adding or dropping a flower needs no change
 * here — but it WILL change the spread, so re-enumerate the combinations.
 */
export function flowerFromPoints(points: number[]): Flower {
  const total = points.reduce((sum, p) => sum + p, 0);
  return loykrathongFlowers[total % loykrathongFlowers.length];
}
