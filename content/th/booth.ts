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
  /** On the result's ticket, so the staff holding the iPad hand over both. */
  ticketLine: string;
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
      resultNote: 'ดอกไม้ของคุณคือ',
      title: 'เอาหน้านี้ไปโชว์ที่บูธ',
    },
    // The council's wording, kept as announced: students read it as 10 baht off.
    reward: {
      lead: 'คุณเป็นดอกไม้แบบไหน? ตอบ 4 ข้อ รับเลย',
      headline: 'คูปองลดไอศกรีม',
      amount: '10 บาทฟรี',
      extra: '+ ดอกไม้ไปแต่งกระทง',
      kioskLine: 'ตอบครบ รับคูปองลดไอศกรีม 10 บาท + ดอกไม้',
      ticketLine: '+ คูปองลดไอศกรีม 10 บาท',
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
  /**
   * The other side of this flower's strength: the quiet way a student like this
   * can be tired without showing it. Every result says it, so the booth's one idea
   * (looking okay and being okay are not the same thing) reaches everyone, not
   * only those who answer the honest question that way. DRAFT, for council review;
   * never a diagnosis, never "you are fine" (BRIEF §12).
   */
  hidden: string;
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
    hidden: 'ดูนิ่ง ๆ แต่ใต้น้ำอาจมีอะไรวุ่นอยู่ก็ได้ และนั่นก็ไม่เป็นไรเลย',
    named: true,
  },
  {
    id: 'crown-flower',
    tint: 5, // blue over pink reads as the lilac of the common variety
    name: 'ดอกรัก',
    body: 'ใจดี ห่วงใยคนรอบตัว',
    fact: 'ชื่อแปลว่า "รัก" ตรง ๆ เลย',
    wish: 'ขอให้วันนี้ได้รักตัวเองเพิ่มอีกนิด',
    hidden: 'ห่วงคนอื่นเก่ง จนบางทีลืมถามใจตัวเองว่าโอเคไหม',
    named: true,
  },
  {
    id: 'globe-amaranth',
    tint: 1, // magenta-purple, the usual colour of the globe
    name: 'ดอกบานไม่รู้โรย',
    body: 'ยิ้มง่าย อยู่กับเพื่อนได้นาน ไม่จางไปไหน',
    fact: 'ตากแห้งเก็บไว้นานแค่ไหนก็ยังสีเดิม',
    wish: 'ขอให้ความรู้สึกดี ๆ ของวันนี้อยู่กับคุณไปนาน ๆ',
    hidden: 'ยิ้มให้ทุกคนได้ แต่ไม่ต้องยิ้มตลอดเวลาก็ได้นะ',
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
    hidden: 'ทนแดดเก่ง จนบางทีลืมว่าตัวเองก็เหนื่อยได้',
    named: true,
  },
  {
    id: 'orchid',
    tint: 2,
    name: 'กล้วยไม้',
    body: 'ไม่เหมือนใคร มีสไตล์เป็นของตัวเอง',
    fact: 'ดอกบานอยู่ได้นานหลายวัน บางชนิดหลายสัปดาห์',
    wish: 'ขอให้ได้เป็นตัวเองในแบบที่ไม่เหมือนใคร',
    hidden: 'ไม่เหมือนใคร เลยบางทีรู้สึกว่าไม่มีใครเข้าใจ ซึ่งหลายคนก็เคยรู้สึกแบบนี้',
    named: true,
  },
  {
    id: 'champak',
    tint: 4, // yellow-orange, as champak is
    name: 'จำปี',
    body: 'เงียบ ๆ แต่อบอุ่น อยู่ตรงไหนก็หอมไกล',
    fact: 'หอมแรง ได้กลิ่นตั้งแต่ไกล',
    wish: 'ขอให้มีเรื่องดี ๆ ให้จำ มากกว่าเรื่องที่อยากลืม',
    hidden: 'อบอุ่นแบบเงียบ ๆ เรื่องในใจเลยมักเก็บไว้เงียบ ๆ ด้วย',
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
      { id: 'a', label: 'นอนต่อ ไม่ต้องรีบไปไหน', value: 0, mark: 'circle' },
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

export type OkayChoiceId = 'real' | 'hide' | 'depends';

export interface OkayQuestion {
  id: 'ok';
  note: string;
  headline: string;
  choices: { id: OkayChoiceId; label: string; mark: ChoiceMark }[];
}

/**
 * The booth's one honest question, asked after the three flower questions.
 *
 * The booth is the quick, in-event part of the week, and its one idea is that
 * looking okay and being okay are not the same thing, and both are normal. This
 * asks it lightly, about a habit ("what do you usually answer?") rather than a
 * state, so it never reads as a screening item (BRIEF §12).
 *
 * It is never scored: the flower comes from the three quiz answers only, so
 * `npm run check:booth` and the flower stock are untouched. It is stored like any
 * other answer (an anonymous choice id), and the TV shows only a guarded total of
 * it (lib/booth-wall.ts). DRAFT copy, for council review.
 */
export const okayQuestion: OkayQuestion = {
  id: 'ok',
  note: 'ข้อนี้ไม่มีผลกับดอกไม้ ตอบตามจริงได้เลย',
  // A word joiner (U+2060) inside "โอเคไหม", so a line never breaks between โอเค
  // and ไหม: Thai has no spaces, and the browser's dictionary sees two words.
  headline: 'ถ้ามีคนถามว่า "โอเค\u2060ไหม" ปกติคุณตอบว่า...',
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

/** The label above a flower's `hidden` line on a result. */
export const hiddenLabel = 'อีกด้านของดอกนี้';

/**
 * The bridge from the booth to the main site, shown beside a QR code on the TV and
 * on the kiosk's result. The booth is the quick part; the deeper questions are on
 * the site, for later, in a student's own time.
 */
export const qrInvite = {
  title: 'อยากรู้ว่าใจจริง ๆ เป็นยังไง?',
  body: 'สแกนเก็บไว้ เช็กใจตอนว่าง ๆ',
} as const;

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
 * what the phone runs to show one. Returns null unless every quiz question is
 * answered exactly once with a choice that exists. An answer to okayQuestion may be
 * among the pairs and is ignored.
 */
export function flowerFromChoices(
  pairs: { questionId: string; choiceId: string }[],
): Flower | null {
  // The honest question (okayQuestion) is stored with the rest but never scored,
  // so it is set aside here: the flower is only ever the three quiz answers.
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
      lead: 'ตอบ 4 ข้อ รับเลย',
      headline: 'คุณเป็นดอกไม้แบบไหน?',
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
  idleTitle: 'คุณเป็นดอกไม้แบบไหน?',
  idleBody: 'ตอบ 4 ข้อ ดูว่าดอกไม้ของคุณซ่อนอะไรไว้ แล้วรับดอกไม้ไปแต่งกระทง',
  idleAction: 'เริ่มเลย',
  resultNote: 'ดอกไม้ของคุณคือ',
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
