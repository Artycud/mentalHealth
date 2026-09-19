/**
 * Festival themes for booth mode.
 *
 * Dates, times and places are NOT here. They live in lib/events.ts so the
 * admin panel's กิจกรรม (Events) section can change them without touching
 * copy. What the project document says about each booth's activities and
 * wellbeing theme stays here, because that is wording, not schedule.
 *
 * Only one festival is active at a time and the admin panel chooses it (§8).
 * A theme changes ONLY four things: the accent colour that replaces sunflower,
 * the small home festival icon, the booth illustration, and the booth copy and
 * result set. Paper, ink, pink, blue, typography, components, spacing and
 * motion are identical across every festival. A theme must never introduce a
 * new font, a gradient, or snow or heart animations.
 */

import type { ChoiceMark, FestivalId, Tint } from '@/lib/types';

export interface FestivalTheme {
  id: FestivalId;
  name: string;
  /** Replaces --sunflower. The only colour a theme may swap. */
  accent: string;
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
  };
}

export const festivals: Record<FestivalId, FestivalTheme> = {
  loykrathong: {
    id: 'loykrathong',
    name: 'ลอยกระทง',
    accent: '#FFB511',
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
    },
  },
  christmas: {
    id: 'christmas',
    name: 'คริสต์มาส',
    accent: '#FFB511', // TODO: awaiting council — placeholder accent
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
 * "ดอก" + name, unless the name already starts with it. ดาวเรือง and กล้วยไม้ and
 * จำปี need the prefix to read naturally in a sentence ("รับดอกดาวเรือง");
 * ดอกบัว and ดอกรัก already have it and would come out as "ดอกดอกบัว".
 */
export const withDok = (name: string) => (name.startsWith('ดอก') ? name : `ดอก${name}`);

/**
 * Loy Krathong flower results.
 *
 * The six the booth actually stocks, given by the student council. ดาวเรือง's
 * body line is written in BRIEF §8. Everything else about the five others —
 * `body` and `wish` — is a DRAFT awaiting council review: each `body` rests on
 * one plainly true thing about the flower (the meaning of its name, its scent,
 * how long it lasts) rather than an invented trait, and each `wish` is a warm
 * line in the booth's own theme of letting go. Order and names may still change
 * before the booth — the council said so directly — so nothing else in the
 * codebase should assume this order or count beyond `loykrathongFlowers.length`
 * and lookup-by-`id`.
 */
export interface Flower {
  id: string;
  name: string;
  /** One line on the flower, closing on the "เหมือนคำตอบเมื่อกี้" hook (§10). */
  body: string;
  /** A short wish for the student, shown on the result. Draft — never advice. */
  wish: string;
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
    wish: 'ขอให้เรื่องที่หนักใจ ไหลผ่านไปเหมือนน้ำบนใบบัว',
    named: true,
  },
  {
    id: 'crown-flower',
    tint: 5, // blue over pink reads as the lilac of the common variety
    name: 'ดอกรัก',
    body: 'ชื่อแปลว่ารักตรง ๆ เลย เหมือนคำตอบเมื่อกี้ของคุณเลย',
    wish: 'ขอให้วันนี้ได้รักตัวเองเพิ่มอีกนิด',
    named: true,
  },
  {
    id: 'globe-amaranth',
    tint: 1, // magenta-purple, the usual colour of the globe
    name: 'ดอกบานไม่รู้โรย',
    body: 'เก็บไว้นานแค่ไหนก็ยังสีเดิม เหมือนคำตอบเมื่อกี้ของคุณเลย',
    wish: 'ขอให้ความรู้สึกดี ๆ ของวันนี้อยู่กับคุณไปนาน ๆ',
    named: true,
  },
  {
    // BRIEF §8's written reference flower — id stays 'marigold' so
    // app/(student)/booth/page.tsx can find it by id regardless of order.
    id: 'marigold',
    tint: 0, // the yellow-and-orange of the hand-drawn marigold
    name: 'ดาวเรือง',
    body: 'สีสด ทนแดด อยู่ได้นาน เหมือนคำตอบเมื่อกี้ของคุณเลย',
    wish: 'ขอให้มีแรงใจสู้แดดสู้ฝนไปได้อีกนาน',
    named: true,
  },
  {
    id: 'orchid',
    tint: 2,
    name: 'กล้วยไม้',
    body: 'บานอยู่ได้นานกว่าดอกไม้ทั่วไป เหมือนคำตอบเมื่อกี้ของคุณเลย',
    wish: 'ขอให้ได้เป็นตัวเองในแบบที่ไม่เหมือนใคร',
    named: true,
  },
  {
    id: 'champak',
    tint: 4, // yellow-orange, as champak is
    name: 'จำปี',
    body: 'หอมไกลจนได้กลิ่นก่อนเห็นดอก เหมือนคำตอบเมื่อกี้ของคุณเลย',
    wish: 'ขอให้มีเรื่องดี ๆ ให้จำ มากกว่าเรื่องที่อยากลืม',
    named: true,
  },
];

/**
 * The 3-question booth quiz. DRAFT — awaiting council review.
 *
 * Written to be answered on instinct. It is a game in a queue at a noisy
 * canteen, usually with someone standing behind you, so every question is a
 * concrete everyday choice ("what would you do?", "which colour?") with short
 * answers and no right one. Nothing here asks how a student is feeling — that
 * is the check-in's job, on their own phone — and nothing should ever drift
 * back toward it, because the answer can be read over a shoulder.
 *
 * The first draft asked "if you could float one thing away, what?" and "what
 * does your krathong look like?". Those are lovely but they make you stop and
 * think, and the queue is watching.
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
 * The points below (Q1 0–3, Q2 {4,5,0,1}, Q3 {2,3,4,5}, by position a–d) are
 * what produce that spread. Rewording a choice is safe; moving its points is
 * not. After ANY edit to this quiz, run `npm run check:booth`: it enumerates all
 * 64 answer sets against this file and fails if a flower is too rare or too
 * common, or if two answers to one question count the same.
 */
export interface BoothChoice {
  id: string;
  label: string;
  /** Added to the running total. See the note above before changing. */
  points: number;
  /** The picture beside the answer: a shape, or a colour swatch. */
  mark: ChoiceMark;
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
    note: 'ไม่มีถูกผิด เลือกตามใจเลย',
    headline: 'วันหยุดยาว อยากทำอะไรที่สุด?',
    choices: [
      { id: 'a', label: 'นอนให้เต็มอิ่ม', points: 0, mark: 'circle' },
      { id: 'b', label: 'ไปเที่ยวกับเพื่อน', points: 1, mark: 'square' },
      { id: 'c', label: 'ดูซีรีส์ทั้งวัน', points: 2, mark: 'leaf' },
      { id: 'd', label: 'ออกไปเดินเล่น', points: 3, mark: 'drop' },
    ],
  },
  {
    id: 'b2',
    note: 'เลือกสีแรกที่เห็นแล้วชอบ',
    headline: 'ชอบสีไหนที่สุด?',
    choices: [
      { id: 'a', label: 'ชมพู', points: 4, mark: 'pink' },
      { id: 'b', label: 'ฟ้า', points: 5, mark: 'blue' },
      { id: 'c', label: 'เหลือง', points: 0, mark: 'yellow' },
      { id: 'd', label: 'น้ำเงินเข้ม', points: 1, mark: 'navy' },
    ],
  },
  {
    id: 'b3',
    note: 'ข้อสุดท้ายแล้ว',
    headline: 'ไปงานลอยกระทง อยากทำอะไรก่อน?',
    choices: [
      { id: 'a', label: 'ลอยกระทง', points: 2, mark: 'circle' },
      { id: 'b', label: 'กินของอร่อย', points: 3, mark: 'square' },
      { id: 'c', label: 'ถ่ายรูปสวย ๆ', points: 4, mark: 'leaf' },
      { id: 'd', label: 'เดินดูของ', points: 5, mark: 'drop' },
    ],
  },
];

/**
 * What to do at the booth after getting a flower.
 *
 * Titles only, and only names the project document gives for the Loy Krathong
 * booth (โซน Mini ลอยกระทง, กิจกรรมแปะดอกไม้แทนความรู้สึก, Workshop พับกระดาษ
 * โอริกามิเป็นดอกบัว). The document names them but says nothing about how they
 * run, so no detail is invented here. The council should confirm which run on
 * which day before this goes on a screen students believe.
 */
export const boothNext = {
  title: 'ต่อไปที่บูธ',
  items: [
    'ลอยกระทงที่โซน Mini ลอยกระทง',
    'แปะดอกไม้แทนความรู้สึก',
    'พับกระดาษเป็นดอกบัวที่เวิร์กช็อป',
  ],
} as const;

/** Copy for the kiosk, which is read standing up by a queue. */
export const kiosk = {
  idleTitle: 'คุณเป็นดอกไม้แบบไหน?',
  idleBody: 'ตอบ 3 ข้อ แล้วรับดอกไม้ไปแต่งกระทง',
  idleAction: 'เริ่มเลย',
  resultNote: 'ดอกไม้ของคุณคือ',
  wishLabel: 'คำอวยพรจากดอกไม้',
  ticketTitle: 'โชว์หน้านี้ที่บูธ',
  again: 'เล่นอีกครั้ง',
  back: 'ย้อนกลับ',
  /**
   * Seconds of no touching on the result before it resets for the next student.
   * Long enough to read everything now on it, and any touch starts it over — a
   * student mid-read is never cut off.
   */
  resetSeconds: 45,
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
