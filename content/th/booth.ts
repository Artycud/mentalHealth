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
 * The six the booth actually stocks, given by the student council. Every
 * `body`, `fact` and `wish` is a DRAFT awaiting council review. (ดาวเรือง's
 * `body` began as the line written in BRIEF §8; the council later asked for its
 * closing phrase "เหมือนคำตอบเมื่อกี้ของคุณเลย" to be removed from all six.)
 *
 * Each flower is a personality (see the quiz below), so `body` describes it in
 * three or four plain words. It is earned: the quiz really does measure the two
 * things each description talks about. `fact` is one plainly true thing about
 * the real flower, and `wish` is a warm line in the booth's theme of letting go.
 *
 * Order and names may still change before the booth — the council said so
 * directly — so nothing else in the codebase should assume this order or count
 * beyond `loykrathongFlowers.length` and lookup-by-`id`.
 */
export interface Flower {
  id: string;
  name: string;
  /** The personality, in a few plain words. */
  body: string;
  /** One true thing about the real flower. Small caption, never advice. */
  fact: string;
  /** A short wish for the student. Draft — never advice. */
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
    body: 'นิ่ง สงบ ปล่อยวางเก่ง',
    fact: 'น้ำกลิ้งหลุดจากใบบัวได้ ไม่เปียกติด',
    wish: 'ขอให้เรื่องที่หนักใจ ไหลผ่านไปเหมือนน้ำบนใบบัว',
    named: true,
  },
  {
    id: 'crown-flower',
    tint: 5, // blue over pink reads as the lilac of the common variety
    name: 'ดอกรัก',
    body: 'ใจดี ห่วงใยคนรอบตัว',
    fact: 'ชื่อแปลว่า "รัก" ตรง ๆ เลย',
    wish: 'ขอให้วันนี้ได้รักตัวเองเพิ่มอีกนิด',
    named: true,
  },
  {
    id: 'globe-amaranth',
    tint: 1, // magenta-purple, the usual colour of the globe
    name: 'ดอกบานไม่รู้โรย',
    body: 'ยิ้มง่าย อยู่กับเพื่อนได้นาน ไม่จางไปไหน',
    fact: 'ตากแห้งเก็บไว้นานแค่ไหนก็ยังสีเดิม',
    wish: 'ขอให้ความรู้สึกดี ๆ ของวันนี้อยู่กับคุณไปนาน ๆ',
    named: true,
  },
  {
    // BRIEF §8's written reference flower — id stays 'marigold' so
    // app/(student)/booth/page.tsx can find it by id regardless of order.
    id: 'marigold',
    tint: 0, // the yellow-and-orange of the hand-drawn marigold
    name: 'ดาวเรือง',
    body: 'สีสด ทนแดด อยู่ได้นาน',
    fact: 'ปลูกง่าย ชอบแดดจัด ๆ',
    wish: 'ขอให้มีแรงใจสู้แดดสู้ฝนไปได้อีกนาน',
    named: true,
  },
  {
    id: 'orchid',
    tint: 2,
    name: 'กล้วยไม้',
    body: 'ไม่เหมือนใคร มีสไตล์เป็นของตัวเอง',
    fact: 'ดอกบานอยู่ได้นานหลายวัน บางชนิดหลายสัปดาห์',
    wish: 'ขอให้ได้เป็นตัวเองในแบบที่ไม่เหมือนใคร',
    named: true,
  },
  {
    id: 'champak',
    tint: 4, // yellow-orange, as champak is
    name: 'จำปี',
    body: 'เงียบ ๆ แต่อบอุ่น อยู่ตรงไหนก็หอมไกล',
    fact: 'หอมแรง ได้กลิ่นตั้งแต่ไกล',
    wish: 'ขอให้มีเรื่องดี ๆ ให้จำ มากกว่าเรื่องที่อยากลืม',
    named: true,
  },
];

/**
 * The 3-question booth quiz. DRAFT — awaiting council review.
 *
 * Still written to be answered on instinct. It is a game in a queue at a noisy
 * canteen with someone standing behind you, so every question is a concrete
 * everyday choice, the answers are short, and none is better than another. It
 * asks what a student DOES, never how they FEEL — that is the check-in's job, on
 * their own phone, and nothing here should drift back toward it, because the
 * answer can be read over a shoulder.
 *
 * What changed from the first version, and why. The questions used to be
 * arbitrary (a colour, a snack) and the flower came out of arithmetic, so the
 * result saying "like your answers" was a small fib. Now the quiz measures two
 * real things and each flower is one combination of them:
 *
 *   ENERGY  calm · in between · lively      (two questions, each 0–2)
 *   HEART   looks after self · after others (one question, 0 or 1)
 *
 *                     self          others
 *       calm          ดอกบัว        จำปี
 *       in between    กล้วยไม้       ดอกรัก
 *       lively        ดาวเรือง      ดอกบานไม่รู้โรย
 *
 * Fair by construction. Energy is asked twice (a morning question and a social
 * one) and the two are added: sums 0–1 are "calm", 2 is "in between", 3–4 are
 * "lively", which splits the nine possible pairs into exact thirds. With the
 * heart answer that is 3 × 3 × 2 = 18 answer sets and every flower gets exactly
 * 3 of them, 16.7%. That matters because the booth hands out PHYSICAL flowers:
 * a lopsided quiz means running out of some and holding a pile of others. All
 * three questions matter, and there is no tie-break to explain.
 *
 * Two of the questions have only three answers and one has two. That is on
 * purpose — fewer choices are quicker to answer — but it is also load-bearing,
 * so after ANY edit run `npm run check:booth`. It enumerates every answer set
 * against this file and fails if a flower is too rare or too common, if a
 * question has two answers that count the same, or if a flower cannot be reached.
 */
export type Axis = 'energy' | 'heart';

export interface BoothChoice {
  id: string;
  label: string;
  /** Energy: 0 calm, 1 in between, 2 lively. Heart: 0 self, 1 others. */
  value: number;
  /** The picture beside the answer. A shape carries no meaning, on purpose. */
  mark: ChoiceMark;
}

export interface BoothQuestion {
  id: string;
  headline: string;
  note: string;
  /** Which of the two things this question measures. */
  axis: Axis;
  choices: BoothChoice[];
}

export const loykrathongQuiz: BoothQuestion[] = [
  {
    id: 'b1',
    axis: 'energy',
    note: 'ไม่มีถูกผิด เลือกตามใจเลย',
    headline: 'เช้าวันหยุด อยากทำอะไร?',
    choices: [
      { id: 'a', label: 'นอนต่อ ไม่ต้องรีบไหน', value: 0, mark: 'circle' },
      { id: 'b', label: 'ค่อย ๆ ตื่น หาของกิน', value: 1, mark: 'square' },
      { id: 'c', label: 'ลุกเลย มีแผนแล้ว', value: 2, mark: 'leaf' },
    ],
  },
  {
    id: 'b2',
    axis: 'heart',
    note: 'ตอบเร็ว ๆ ได้เลย',
    headline: 'ได้เงินมานิดหน่อย จะเอาไปทำอะไร?',
    choices: [
      { id: 'a', label: 'ซื้อของให้ตัวเองสักชิ้น', value: 0, mark: 'drop' },
      { id: 'b', label: 'ซื้อขนมไปแบ่งกับเพื่อน', value: 1, mark: 'square' },
    ],
  },
  {
    id: 'b3',
    axis: 'energy',
    note: 'ข้อสุดท้ายแล้ว',
    headline: 'เพื่อนชวนไปงานเย็นนี้ คุณจะ...',
    choices: [
      { id: 'a', label: 'ขอพักที่บ้านนะ', value: 0, mark: 'circle' },
      { id: 'b', label: 'ไปแป๊บเดียวแล้วกลับ', value: 1, mark: 'leaf' },
      { id: 'c', label: 'ไปสิ! ไปด้วยเลย', value: 2, mark: 'drop' },
    ],
  },
];

/** One answer, as the kiosk stores it and the server will recompute from. */
export interface BoothAnswer {
  axis: Axis;
  value: number;
}

/** Rows are energy (calm, in between, lively); columns are heart (self, others). */
const FLOWER_GRID: string[][] = [
  ['lotus', 'champak'],
  ['orchid', 'crown-flower'],
  ['marigold', 'globe-amaranth'],
];

/**
 * Two energy answers add to 0–4. Splitting at 1|2|3 puts three of the nine
 * possible pairs in each band, which is what keeps every flower at exactly a
 * sixth. If the number of energy questions ever changes, these thresholds must
 * change with it — `npm run check:booth` will say so.
 */
const energyLevel = (sum: number) => (sum <= 1 ? 0 : sum === 2 ? 1 : 2);

/**
 * The flower for a set of answers. Deterministic, so the server can recompute
 * it from stored answers (§3) and never has to trust the client.
 */
export function flowerFromAnswers(answers: BoothAnswer[]): Flower {
  const sum = (axis: Axis) =>
    answers.filter((a) => a.axis === axis).reduce((total, a) => total + a.value, 0);
  const heart = sum('heart') >= 1 ? 1 : 0;
  const id = FLOWER_GRID[energyLevel(sum('energy'))][heart];
  return loykrathongFlowers.find((f) => f.id === id) ?? loykrathongFlowers[0];
}

/**
 * The flower for a set of stored answers (question id + choice id). This is what
 * the server runs to recompute a booth result from what it saved (BRIEF §3), and
 * what the phone runs to show one. Returns null unless every question is answered
 * exactly once with a choice that exists.
 */
export function flowerFromChoices(
  pairs: { questionId: string; choiceId: string }[],
): Flower | null {
  if (pairs.length !== loykrathongQuiz.length) return null;
  const answers: BoothAnswer[] = [];
  for (const question of loykrathongQuiz) {
    const matches = pairs.filter((p) => p.questionId === question.id);
    if (matches.length !== 1) return null;
    const choice = question.choices.find((c) => c.id === matches[0].choiceId);
    if (!choice) return null;
    answers.push({ axis: question.axis, value: choice.value });
  }
  return flowerFromAnswers(answers);
}

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

/** Copy for the TV. */
export const tv = {
  /** On the water before anyone has played today. */
  empty: 'ยังไม่มีใครเล่นวันนี้ มาเป็นคนแรกเลย',
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
