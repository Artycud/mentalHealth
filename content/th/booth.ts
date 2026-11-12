/**
 * Festival themes for booth mode.
 *
 * Dates, times and places are NOT here. They live in lib/events.ts so the
 * admin panel's กิจกรรม (Events) section can change them without touching
 * copy. What the project document says about each booth's activities and
 * wellbeing theme stays here, because that is wording, not schedule.
 *
 * Only one festival is active at a time and the admin panel chooses it (§8).
 * A festival is a scene on top of the base identity, and changes only: its scene
 * and the few colours the scene needs (app/festivals/<id>.css, drawn by
 * components/festival/), its small home icon, and this copy and result set. Paper,
 * text colours, typography, components, spacing and motion are identical across
 * every festival. A festival must never introduce a new font, or snow or heart
 * animations. Its colours are not here: they are CSS, so the theme is one file.
 */

import type { ChoiceMark, FestivalId, Tint } from '@/lib/types';

import { feelings } from './heart.ts';

export interface FestivalTheme {
  id: FestivalId;
  name: string;
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
  /**
   * What a student gets for playing, as the TV's headline. Optional: a booth with
   * no reward leads with its flower instead (tv.hook.flowerOnly). An admin switches
   * it off when it runs out (lib/settings.ts getRewardOn), so no screen promises
   * something the booth no longer has.
   */
  reward?: Reward;
}

/**
 * The booth's reward, split the way the TV sets it: a short lead, the headline,
 * and the amount in the biggest type on the screen. Written exactly as the council
 * announces it.
 */
export interface Reward {
  lead: string;
  headline: string;
  amount: string;
  /** What else comes with it, one small line under the amount. */
  extra: string;
  /** The kiosk's idle screen, under the start button's lead. */
  kioskLine: string;
  /** The kiosk result's notification: a title and what was received. Staff read it too. */
  toastTitle: string;
  received: string;
}

export const festivals: Record<FestivalId, FestivalTheme> = {
  loykrathong: {
    id: 'loykrathong',
    name: 'ลอยกระทง',
    theme: 'การปล่อยวางความทุกข์ และการจัดการความรู้สึกเชิงลบ',
    ready: true,
    home: {
      blurb: 'ตอบคำถามสั้น ๆ แล้วเอาผลไปรับดอกไม้มาแต่งกระทงที่บูธ',
    },
    ticket: {
      label: 'บูธลอยกระทง',
      resultNote: 'ดอกไม้สำหรับใจนี้',
      title: 'เอาหน้านี้ไปโชว์ที่บูธ',
    },
    // The council's wording, kept as announced: students read it as 10 baht off.
    reward: {
      lead: 'ใจวันนี้ได้ดอกไม้อะไร? เล่น 4 ข้อ รับเลย',
      headline: 'คูปองลดไอศกรีม',
      amount: '10 บาทฟรี',
      extra: '+ ดอกไม้ไปแต่งกระทง',
      kioskLine: 'ตอบครบ รับคูปองลดไอศกรีม 10 บาท + ดอกไม้',
      toastTitle: 'ได้คูปองแล้ว!',
      received: 'คูปองลดไอศกรีม 10 บาท รับที่บูธพร้อมดอกไม้',
    },
  },
  christmas: {
    id: 'christmas',
    name: 'คริสต์มาส',
    theme: 'การสร้างความหวังในชีวิต และการจัดการความรู้สึกเมื่อเกิดความผิดหวัง',
    ready: false,
    // TODO: awaiting council content. Booth activities are known from the
    // project document (เขียนขอพรใส่ถุงเท้า, ตกแต่งต้นคริสต์มาส, พับกระดาษเป็น
    // ต้นคริสต์มาส) but the quiz and its results are not written yet.
  },
  'cny-valentine': {
    id: 'cny-valentine',
    name: 'ตรุษจีน & วาเลนไทน์',
    theme: 'การให้ความรู้สึกรัก และการปรับตัวให้เข้ากับทุกรูปแบบความสัมพันธ์',
    ready: false,
    // TODO: awaiting council content. Activities known (บูธขายสินค้า,
    // มุมรวมคนอกหัก, เขียนคำอวยพรใส่ซองตรุษจีน); quiz and results are not.
  },
};

/** Order of the festivals, which also fixes the order of the next-booth pills. */
export const festivalOrder: FestivalId[] = ['loykrathong', 'christmas', 'cny-valentine'];

/** The booth quiz's own title, as the project document names it. */
export const boothQuizTitle = 'ใจวันนี้ ได้ดอกไม้อะไร?';

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
 * Each flower is given FOR a feeling (see FEELING_FLOWERS below), so `body` says
 * which heart it is for. `fact` is one plainly true thing about the real flower,
 * and `wish` is a warm line in the booth's theme of letting go.
 *
 * Order and names may still change before the booth — the council said so
 * directly — so nothing else in the codebase should assume this order or count
 * beyond `loykrathongFlowers.length` and lookup-by-`id`.
 */
export interface Flower {
  id: string;
  name: string;
  /** Which heart this flower is for ("สำหรับใจที่…"). */
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
    body: 'สำหรับใจที่แบกอะไรไว้เยอะ ให้มันค่อย ๆ ไหลผ่านไป',
    fact: 'น้ำกลิ้งหลุดจากใบบัวได้ ไม่เปียกติด',
    wish: 'ขอให้เรื่องที่หนักใจ ไหลผ่านไปเหมือนน้ำบนใบบัว',
    named: true,
  },
  {
    id: 'crown-flower',
    tint: 5, // blue over pink reads as the lilac of the common variety
    name: 'ดอกรัก',
    body: 'สำหรับใจที่เหนื่อย อยากพัก',
    fact: 'ชื่อแปลว่า "รัก" ตรง ๆ เลย',
    wish: 'ขอให้วันนี้ได้รักตัวเองเพิ่มอีกนิด',
    named: true,
  },
  {
    id: 'globe-amaranth',
    tint: 1, // magenta-purple, the usual colour of the globe
    name: 'ดอกบานไม่รู้โรย',
    body: 'สำหรับใจที่สบาย ๆ ให้อยู่แบบนี้ไปนาน ๆ',
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
    body: 'สำหรับใจที่มีแรงเต็มเปี่ยม',
    fact: 'ปลูกง่าย ชอบแดดจัด ๆ',
    wish: 'ขอให้มีแรงใจสู้แดดสู้ฝนไปได้อีกนาน',
    named: true,
  },
  {
    id: 'orchid',
    tint: 2,
    name: 'กล้วยไม้',
    body: 'สำหรับใจที่เฉย ๆ ไม่ขึ้นไม่ลง',
    fact: 'ดอกบานอยู่ได้นานหลายวัน บางชนิดหลายสัปดาห์',
    wish: 'ขอให้ได้เป็นตัวเองในแบบที่ไม่เหมือนใคร',
    named: true,
  },
  {
    id: 'champak',
    tint: 4, // yellow-orange, as champak is
    name: 'จำปี',
    body: 'สำหรับใจที่โอเค ไปได้เรื่อย ๆ',
    fact: 'หอมแรง ได้กลิ่นตั้งแต่ไกล',
    wish: 'ขอให้มีเรื่องดี ๆ ให้จำ มากกว่าเรื่องที่อยากลืม',
    named: true,
  },
];

/**
 * The booth quiz: how is your heart right now? DRAFT — awaiting council review.
 *
 * It used to be three personality questions ("เช้าวันหยุด อยากทำอะไร?"). The
 * council changed it (2026-11-12): the booth now asks about the feeling itself,
 * the same two things as the home's "ใจวันนี้" (content/th/heart.ts), so a
 * student who plays at the booth has already met the idea the main site is
 * built on. It is asked through things everyone knows:
 *
 *   ENERGY  a phone battery   ใกล้หมด · พอไหว · เต็มหลอด
 *   WEIGHT  a school bag      โล่ง · ปานกลาง · หนักอึ้ง
 *
 * On the kiosk both are asked on a jelly heart, dragged directly and sideways
 * for both (components/booth/HeartMeter): the first fills it with charge, the
 * second makes it heavy, drooping like a water balloon.
 *   TOPIC   what fills your head most, one of nine (tapped; never scored)
 *
 * Energy × weight is one of the home's nine feelings (สบาย ๆ … เครียด), and each
 * feeling has a flower "for that heart" (FEELING_FLOWERS below). On the kiosk the
 * two are drags that the picture follows; what is stored is which third the
 * finger ended in, as an ordinary choice id, so the phone, the server, the admin
 * and the recap read them like any other question.
 *
 * The flowers are physical, and how many of each go out now depends on how the
 * room feels, which nobody can balance in advance; the staff's stock line on the
 * kiosk is how the booth keeps an eye on it. `npm run check:booth` checks that
 * every flower can be reached and that only energy and weight decide it.
 */
export type Axis = 'energy' | 'weight' | 'topic';

export type TopicIcon =
  | 'study'
  | 'friends'
  | 'family'
  | 'love'
  | 'sleep'
  | 'social'
  | 'future'
  | 'self'
  | 'none';

export interface BoothChoice {
  id: string;
  label: string;
  /** Energy: 0 low … 2 full. Weight: 0 light … 2 heavy. Topic: unused. */
  value: number;
  /** The picture beside the answer where it is a tap (the phone). Carries no meaning. */
  mark: ChoiceMark;
  /** The topic's own picture, on the kiosk's grid. */
  icon?: TopicIcon;
}

export interface BoothQuestion {
  id: string;
  headline: string;
  note: string;
  /** What this question is about. */
  axis: Axis;
  choices: BoothChoice[];
  /**
   * Asked as a drag on the kiosk. The three `anchors` are what the picture says
   * as the finger moves through each third; the answer is the third it ends in.
   */
  meter?: {
    hint: string;
    /** On the heart until it is touched: which way to drag. */
    drag: string;
    ends: { low: string; high: string };
    anchors: [string, string, string];
    go: string;
  };
}

export const loykrathongQuiz: BoothQuestion[] = [
  {
    id: 'energy',
    axis: 'energy',
    note: 'ข้อ 1 · ไม่มีถูกผิด',
    // Word joiners (U+2060) hold "แบตมือถือ" together: the browser's Thai
    // dictionary splits it ("แบ|ต", "มือ|ถือ").
    headline: 'ถ้าใจเป็นแบ\u2060ต\u2060มือ\u2060ถือ ตอนนี้เหลือเท่าไหร่?',
    meter: {
      hint: 'ลากหัวใจไปซ้าย–ขวา เติมแบ\u2060ตให้ตรงกับใจตอนนี้',
      drag: 'ลากหัวใจ ← →',
      ends: { low: 'ใกล้หมด', high: 'เต็มหลอด' },
      anchors: ['เปิดโหมดประหยัดพลังงานอยู่', 'ใช้ได้ แต่อย่าเพิ่งเปิดอะไรหนัก ๆ', 'ชาร์จเต็ม พร้อมลุย'],
      go: 'ประมาณนี้แหละ',
    },
    choices: [
      { id: 'low', label: 'แบตใกล้หมด', value: 0, mark: 'circle' },
      { id: 'mid', label: 'แบตพอไหว', value: 1, mark: 'square' },
      { id: 'high', label: 'แบตเต็มหลอด', value: 2, mark: 'leaf' },
    ],
  },
  {
    id: 'weight',
    axis: 'weight',
    note: 'ข้อ 2 · ไม่มีถูกผิด',
    headline: 'เรื่องที่แบกอยู่ในหัววันนี้ หนักแค่ไหน?',
    meter: {
      hint: 'ลากหัวใจไปทางขวา ยิ่งหนัก หัวใจยิ่งถ่วงลง',
      drag: 'ลากหัวใจ ← →',
      ends: { low: 'โล่ง', high: 'หนักอึ้ง' },
      anchors: ['เหมือนกระเป๋าวันไม่มีเรียน', 'เหมือนกระเป๋าวันธรรมดา', 'เหมือนกระเป๋าวันสอบ ครบทุกวิชา'],
      go: 'ประมาณนี้แหละ',
    },
    choices: [
      { id: 'light', label: 'ใจโล่ง', value: 0, mark: 'drop' },
      { id: 'mid', label: 'หนักปานกลาง', value: 1, mark: 'square' },
      { id: 'heavy', label: 'หนักอึ้ง', value: 2, mark: 'circle' },
    ],
  },
  {
    id: 'topic',
    axis: 'topic',
    note: 'ข้อ 3 · เลือกอันที่ใช่ที่สุดอันเดียว',
    headline: 'ตอนนี้อะไรอยู่ในหัว เยอะที่สุด?',
    choices: [
      { id: 'study', label: 'เรื่องเรียน', value: 0, mark: 'square', icon: 'study' },
      { id: 'friends', label: 'เพื่อน', value: 1, mark: 'circle', icon: 'friends' },
      { id: 'family', label: 'ที่บ้าน', value: 2, mark: 'leaf', icon: 'family' },
      { id: 'love', label: 'ความรัก', value: 3, mark: 'drop', icon: 'love' },
      { id: 'sleep', label: 'การนอน', value: 4, mark: 'circle', icon: 'sleep' },
      { id: 'social', label: 'โซเชียล', value: 5, mark: 'square', icon: 'social' },
      { id: 'future', label: 'อนาคต', value: 6, mark: 'leaf', icon: 'future' },
      { id: 'self', label: 'ตัวเอง', value: 7, mark: 'drop', icon: 'self' },
      { id: 'none', label: 'ไม่มีอะไรเป็นพิเศษ', value: 8, mark: 'circle', icon: 'none' },
    ],
  },
];

export type OkayChoiceId = 'real' | 'hide' | 'depends';

export interface OkayQuestion {
  id: 'ok';
  note: string;
  headline: string;
  choices: { id: OkayChoiceId; label: string; mark: ChoiceMark }[];
}

/**
 * The booth's one honest question, asked after the feeling questions.
 *
 * The booth is the quick, in-event part of the week, and its one idea is that
 * looking okay and being okay are not the same thing, and both are normal. This
 * asks it lightly, about a habit ("what do you usually answer?") rather than a
 * state, so it never reads as a screening item (BRIEF §12).
 *
 * It is never scored: the flower comes from energy and weight only. It is stored
 * like any other answer (an anonymous choice id), and the TV shows only a guarded
 * total of it (lib/booth-wall.ts). DRAFT copy, for council review.
 */
export const okayQuestion: OkayQuestion = {
  id: 'ok',
  note: 'ข้อสุดท้าย · ไม่มีผลกับดอกไม้',
  // A word joiner (U+2060) inside "โอเคไหม", so a line never breaks between โอเค
  // and ไหม: Thai has no spaces, and the browser's dictionary sees two words.
  headline: 'ถ้ามีคนถามว่า "โอเค⁠ไหม" ปกติคุณตอบว่า...',
  choices: [
    { id: 'real', label: 'โอเค และโอเคจริง ๆ', mark: 'circle' },
    { id: 'hide', label: 'บอกว่าโอเค แต่จริง ๆ ไม่ค่อย', mark: 'drop' },
    { id: 'depends', label: 'แล้วแต่ว่าใครถาม', mark: 'leaf' },
  ],
};

/** Is this one of okayQuestion's choice ids? */
export const isOkayChoice = (id: string): id is OkayChoiceId =>
  okayQuestion.choices.some((c) => c.id === id);

/**
 * What the result says back to that answer. Every answer gets a warm line, so
 * none of them is the "wrong" one, and none of them is a verdict. DRAFT.
 */
export const okayReply: Record<OkayChoiceId, string> = {
  real: 'ดีใจด้วยนะ วันนี้ลองถามเพื่อนข้าง ๆ ดูบ้าง ว่าเขาโอเคจริงไหม',
  hide: 'หลายคนก็ตอบแบบนี้ ไม่โอเคก็ได้นะ เป็นเรื่องปกติมาก ๆ',
  depends: 'แปลว่าคุณรู้ว่าพูดกับใครได้ ถ้ายังไม่มีใครแบบนั้น ก็ไม่เป็นไรนะ',
};

/** The label above okayReply on a result. */
export const okayReplyLabel = 'เรื่อง "โอเคไหม"';

/**
 * The bridge from the booth to the main site, shown beside a QR code on the TV and
 * on the kiosk's result. The booth is the quick part; the deeper questions are on
 * the site, for later, in a student's own time.
 */
export const qrInvite = {
  title: 'อยากรู้ว่าใจจริง ๆ เป็นยังไง?',
  body: 'สแกนเก็บไว้ เช็กใจตอนว่าง ๆ',
} as const;

/** One answer, as the kiosk holds it while the student plays. */
export interface BoothAnswer {
  axis: Axis;
  value: number;
}

/**
 * The flower for each of the nine feelings. Rows are weight (light, in between,
 * heavy), columns are energy (low, in between, full) — the same grid as
 * content/th/heart.ts `feelings`. Each flower's `body` says which heart it is for.
 *
 *                  low energy        in between      full
 *     light        บานไม่รู้โรย       จำปี             ดาวเรือง
 *                  (สบาย ๆ)          (โอเคดี)        (ใจฟู)
 *     in between   ดอกรัก            กล้วยไม้          ดาวเรือง
 *                  (เนือย ๆ)          (เฉย ๆ)         (ฟุ้ง ๆ)
 *     heavy        ดอกรัก            ดอกบัว           ดอกบัว
 *                  (เหนื่อยใจ)         (หนัก ๆ)         (เครียด)
 */
const FEELING_FLOWERS: string[][] = [
  ['globe-amaranth', 'champak', 'marigold'],
  ['crown-flower', 'orchid', 'marigold'],
  ['crown-flower', 'lotus', 'lotus'],
];

const level = (answers: BoothAnswer[], axis: Axis) =>
  Math.max(0, Math.min(2, answers.find((a) => a.axis === axis)?.value ?? 1));

/** Which of the nine feelings (content/th/heart.ts) a set of answers is. */
export function feelingCell(answers: BoothAnswer[]): { row: number; col: number } {
  return { row: level(answers, 'weight'), col: level(answers, 'energy') };
}

/** The feeling's word and message, from the home's own nine. */
export function feelingFromAnswers(answers: BoothAnswer[]) {
  const { row, col } = feelingCell(answers);
  return feelings[row][col];
}

/**
 * The flower for a set of answers. Deterministic, so the server can recompute
 * it from stored answers (§3) and never has to trust the client.
 */
export function flowerFromAnswers(answers: BoothAnswer[]): Flower {
  const { row, col } = feelingCell(answers);
  const id = FEELING_FLOWERS[row][col];
  return loykrathongFlowers.find((f) => f.id === id) ?? loykrathongFlowers[0];
}

/** Stored answers (question id + choice id) back to the kiosk's own form, or null if incomplete. */
export function answersFromChoices(pairs: { questionId: string; choiceId: string }[]): BoothAnswer[] | null {
  // The honest question (okayQuestion) is stored with the rest but never scored.
  const scored = pairs.filter((p) => p.questionId !== okayQuestion.id);
  if (scored.length !== loykrathongQuiz.length) return null;
  const answers: BoothAnswer[] = [];
  for (const question of loykrathongQuiz) {
    const matches = scored.filter((p) => p.questionId === question.id);
    if (matches.length !== 1) return null;
    const choice = question.choices.find((c) => c.id === matches[0].choiceId);
    if (!choice) return null;
    answers.push({ axis: question.axis, value: choice.value });
  }
  return answers;
}

/**
 * The flower for a set of stored answers (question id + choice id). This is what
 * the server runs to recompute a booth result from what it saved (BRIEF §3), and
 * what the phone runs to show one. Returns null unless every quiz question is
 * answered exactly once with a choice that exists. An answer to okayQuestion may be
 * among the pairs and is ignored.
 */
export function flowerFromChoices(pairs: { questionId: string; choiceId: string }[]): Flower | null {
  const answers = answersFromChoices(pairs);
  return answers ? flowerFromAnswers(answers) : null;
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
  /** The quiet screen for a new flower: the note above it, and the line below. */
  newNote: 'ดอกไม้ดอกใหม่',
  newLine: 'มีคนเพิ่งได้ดอกนี้ ลอยลงแม่น้ำแล้ว',
  /** A laptop driving the TV: shown only while the mouse moves, until full screen. */
  fullscreen: 'เต็มจอ',
  /**
   * The hook: a strip across the top of the TV, always on screen, read in a
   * one-second glance. The reward leads when there is one (FestivalTheme.reward);
   * otherwise the flower itself is the prize.
   */
  hook: {
    flowerOnly: {
      lead: 'เล่น 4 ข้อ รับเลย',
      headline: 'ใจวันนี้ ได้ดอกไม้อะไร?',
      amount: 'รับดอกไม้ฟรี',
      extra: 'ไปแต่งกระทง',
    },
    /** Under the big count on the moon. */
    countLabel: 'คนเล่นแล้ววันนี้',
  },
  /**
   * The awareness band. DRAFT copy, for council review. A line that states a fact
   * carries its source and says only what the source found (BRIEF §0); the rest is
   * plain encouragement and needs none.
   */
  awareness: {
    note: 'เรื่องใจ',
    /** The guarded total of okayQuestion's "hide" answers (lib/booth-wall.ts). */
    stat: (n: number) => `วันนี้ ${n} ใน 10 คนที่มาบูธ`,
    statLine: 'บอกว่า "โอเค" ทั้งที่จริง ๆ ไม่ค่อยโอเค',
    statTail: 'ไม่ได้มีแค่คุณคนเดียวนะ',
    lines: [
      { text: 'ไม่โอเคก็ได้นะ ใจเราก็มีวันเหนื่อย เหมือนร่างกาย' },
      {
        text: 'ทั่วโลก วัยรุ่นอายุ 10–19 ปี ราว 1 ใน 7 คน มีภาวะทางสุขภาพจิต เรื่องใจจึงใกล้ตัวกว่าที่คิด',
        source: 'WHO, Mental health of adolescents, 2024',
      },
      { text: 'ลองถามเพื่อนสักคนว่า "โอเคจริงไหม" แล้วตั้งใจฟังคำตอบ' },
      {
        // The same finding as content/th/heart.ts's หนัก ๆ fact.
        text: 'แค่เรียกชื่อความรู้สึกออกมา เช่น "ตอนนี้เศร้า" สมองส่วนที่ตื่นตัวกับอารมณ์ก็ทำงานเบาลงได้แล้ว',
        source: 'Lieberman et al., Psychological Science, 2007',
      },
      { text: 'การขอให้ใครช่วย ไม่ได้แปลว่าอ่อนแอ' },
    ] as { text: string; source?: string }[],
  },
} as const;

/** Copy for the kiosk, which is read standing up by a queue. */
export const kiosk = {
  idleTitle: 'ใจวันนี้ ได้ดอกไม้อะไร?',
  idleBody: 'ลากหัวใจ เติมแบต ใส่ความหนัก แล้วดูว่าใจวันนี้ได้ดอกไม้อะไร เอาไปแต่งกระทงได้เลย',
  idleAction: 'เริ่มเลย',
  resultNote: 'ใจวันนี้ของคุณ',
  /** Above the flower's name on the result. */
  flowerFor: 'ดอกไม้สำหรับใจนี้',
  /** While dragging the bag: the heart so far. */
  liveHeart: 'ใจตอนนี้',
  /** Under a disabled "next" until the meter has been touched. */
  touchFirst: 'ลากหรือแตะที่หัวใจก่อนนะ',
  wishLabel: 'คำอวยพรจากดอกไม้',
  ticketTitle: 'โชว์หน้านี้ที่บูธ',
  /** Staff hold the iPad: after a result, they tap this for the next student. */
  again: 'คนต่อไป',
  /** The staff-facing stock line on the idle screen: today's flowers so far. */
  stockTitle: 'แจกไปวันนี้',
  back: 'ย้อนกลับ',
  /**
   * Seconds of no touching on the result before it resets for the next student.
   * Long enough to read everything now on it, and any touch starts it over — a
   * student mid-read is never cut off.
   */
  resetSeconds: 45,
  resetHint: 'จะกลับหน้าแรกใน',
} as const;
