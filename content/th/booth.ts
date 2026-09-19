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

import type { FestivalId } from '@/lib/types';

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
 * ดาวเรือง is written in BRIEF §8. The other three are deliberately unnamed:
 * the booth can only hand out flowers it actually stocks, so the council names
 * them once that is known. The slots exist so the quiz, the TV wall and the
 * admin statistics all work now and only the labels change later.
 */
export interface Flower {
  id: string;
  name: string;
  body: string;
  /** False while the name is a placeholder rather than a real flower. */
  named: boolean;
}

export const loykrathongFlowers: Flower[] = [
  {
    id: 'marigold',
    name: 'ดาวเรือง',
    body: 'สีสด ทนแดด อยู่ได้นาน เหมือนคำตอบเมื่อกี้ของคุณเลย',
    named: true,
  },
  // TODO: awaiting council — the three other flowers the booth stocks.
  { id: 'slot-2', name: 'ดอกไม้ที่ 2', body: 'รอชื่อดอกไม้จากสภานักเรียน', named: false },
  { id: 'slot-3', name: 'ดอกไม้ที่ 3', body: 'รอชื่อดอกไม้จากสภานักเรียน', named: false },
  { id: 'slot-4', name: 'ดอกไม้ที่ 4', body: 'รอชื่อดอกไม้จากสภานักเรียน', named: false },
];

/**
 * The 3-question booth quiz. DRAFT — awaiting council review.
 *
 * Lighter than the check-in: this is a game in a queue at a noisy canteen, not
 * a wellbeing check. It still carries the booth's theme (ปล่อยวางความทุกข์)
 * but never asks anything a student would mind answering with people watching
 * over their shoulder, which rules out the check-in's register entirely.
 *
 * Each choice votes for one flower; most votes wins, ties broken by question
 * order, so the result is deterministic and recomputable on the server (§3).
 */
export interface BoothChoice {
  id: string;
  label: string;
  /** Index into loykrathongFlowers. */
  votes: number;
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
      { id: 'a', label: 'เรื่องที่คิดมากเกินไป', votes: 0 },
      { id: 'b', label: 'ความเหนื่อยที่สะสมไว้', votes: 1 },
      { id: 'c', label: 'เรื่องที่ยังปล่อยไม่ได้', votes: 2 },
      { id: 'd', label: 'ไม่มีอะไรอยากทิ้ง', votes: 3 },
    ],
  },
  {
    id: 'b2',
    note: 'ตอบเร็ว ๆ ได้เลย',
    headline: 'กระทงของคุณหน้าตาเป็นยังไง?',
    choices: [
      { id: 'a', label: 'เรียบ ๆ แต่ดูดี', votes: 0 },
      { id: 'b', label: 'แต่งเต็มที่ สีจัดเต็ม', votes: 1 },
      { id: 'c', label: 'ทำเอง ไม่เหมือนใคร', votes: 2 },
      { id: 'd', label: 'ขอแบบง่าย ๆ เร็ว ๆ', votes: 3 },
    ],
  },
  {
    id: 'b3',
    note: 'ข้อสุดท้ายแล้ว',
    headline: 'ลอยกระทงเสร็จแล้วอยากทำอะไรต่อ?',
    choices: [
      { id: 'a', label: 'ยืนดูน้ำเงียบ ๆ', votes: 0 },
      { id: 'b', label: 'ถ่ายรูปกับเพื่อน', votes: 1 },
      { id: 'c', label: 'เดินกินของในงาน', votes: 2 },
      { id: 'd', label: 'กลับบ้านไปนอน', votes: 3 },
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

/** Most votes wins; ties break by the earliest question, so it is deterministic. */
export function flowerFromVotes(votes: number[]): Flower {
  const tally = [0, 0, 0, 0];
  for (const v of votes) tally[v] += 1;
  let best = 0;
  for (let i = 1; i < tally.length; i += 1) if (tally[i] > tally[best]) best = i;
  // A three-way split (1/1/1) leaves every tally at 1, so `best` stays at the
  // first flower voted for — the earliest question wins, as specified.
  if (tally[best] === 1) return loykrathongFlowers[votes[0]];
  return loykrathongFlowers[best];
}
