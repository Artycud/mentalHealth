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
      lead: 'ใจวันนี้ได้ดอกไม้อะไร? เล่น 5 ข้อ รับเลย',
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
 * The six feelings the booth can name, from the council's quiz (2026-11-16). Each
 * answer in the quiz points at one of them, and the feeling with the most answers
 * is the student's flower. Three are things to let float away with the krathong
 * (sad, angry, worried); three are better passed on than thrown away (happy,
 * excited, love), as มิลินท์ put it.
 */
export type Emotion = 'happy' | 'sad' | 'angry' | 'excited' | 'worried' | 'love';

export const EMOTIONS: readonly Emotion[] = ['happy', 'sad', 'angry', 'excited', 'worried', 'love'];

/** What one of the two levels says: a little of this feeling, or a lot. */
export interface FlowerLevel {
  /** The feeling at this strength, short, for the big word on the result ("เศร้านิด ๆ"). */
  word: string;
  /** A line for a heart like this. Never advice, never a verdict. */
  body: string;
}

/**
 * Loy Krathong flower results: one flower for each feeling, given by the student
 * council (2026-11-16). Every line below is a DRAFT awaiting council review.
 *
 * `fact` is one plainly true thing about the real flower; `release` is what the
 * booth suggests doing with the feeling (let it float away, or pass it on); each
 * flower has two `levels`, by how many of the five answers pointed at its feeling.
 *
 * Lookup is by `id` or `emotion`; nothing should assume this order.
 */
export interface Flower {
  id: string;
  emotion: Emotion;
  /** The feeling's own name ("ความเศร้า"). */
  emotionWord: string;
  name: string;
  /** Which heart this flower is for ("สำหรับใจที่…"). */
  body: string;
  /** A little of the feeling (1–2 of 5 answers), then a lot (3 or more). */
  levels: [FlowerLevel, FlowerLevel];
  /** Let it float away with the krathong, or pass it on. */
  way: 'let-go' | 'pass-on';
  /** What to do with it, said once, warmly. */
  release: string;
  /** One true thing about the real flower. Small caption, never advice. */
  fact: string;
  /** A short wish for the student. Draft, never advice. */
  wish: string;
  /** False while the name is a placeholder rather than a real flower. */
  named: boolean;
  /** The flower's colours on the TV and the stock line (components/booth/flower-marks). */
  tint: Tint;
}

export const loykrathongFlowers: Flower[] = [
  {
    id: 'sunflower',
    emotion: 'happy',
    emotionWord: 'ความสุข',
    tint: 0,
    name: 'ดอกทานตะวัน',
    body: 'สำหรับใจที่มีความสุข',
    levels: [
      { word: 'สุขใจเล็ก ๆ', body: 'วันนี้มีเรื่องดี ๆ อยู่ในใจ เก็บไว้ให้ดี แล้วแบ่งให้คนข้าง ๆ บ้างนะ' },
      { word: 'สุขใจเต็มที่', body: 'ใจคุณสว่างมากวันนี้ ความสุขแบบนี้ยิ่งแบ่ง ยิ่งเยอะ' },
    ],
    way: 'pass-on',
    release: 'ความสุขไม่ต้องลอยทิ้ง ส่งต่อให้คนรอบตัวแทนนะ',
    fact: 'ทานตะวันตอนยังตูม จะค่อย ๆ หันหน้าตามแสงแดด',
    wish: 'ขอให้ความสุขของวันนี้ ส่องไปถึงคนรอบตัวด้วย',
    named: true,
  },
  {
    id: 'hydrangea',
    emotion: 'sad',
    emotionWord: 'ความเศร้า',
    tint: 1,
    name: 'ไฮเดรนเยียสีฟ้า',
    body: 'สำหรับใจที่เศร้าอยู่',
    levels: [
      { word: 'เศร้านิด ๆ', body: 'มีเรื่องที่ทำให้ใจหม่นอยู่บ้าง ไม่เป็นไรนะ ใจเราก็มีวันแบบนี้' },
      { word: 'เศร้ามาก', body: 'ใจคุณแบกความเศร้าไว้เยอะ ไม่ต้องรีบหายก็ได้ ค่อย ๆ ปล่อยทีละนิด' },
    ],
    way: 'let-go',
    release: 'ฝากความเศร้าลอยไปกับกระทงนะ',
    fact: 'สีของไฮเดรนเยียเปลี่ยนตามดิน ดินที่เป็นกรดจะได้ดอกสีฟ้า',
    wish: 'ขอให้วันที่ฟ้าครึ้ม ผ่านไปเร็ว ๆ',
    named: true,
  },
  {
    id: 'red-rose',
    emotion: 'angry',
    emotionWord: 'ความโกรธ',
    tint: 2,
    name: 'กุหลาบแดงเข้ม',
    body: 'สำหรับใจที่ขุ่นอยู่',
    levels: [
      { word: 'หงุดหงิดอยู่', body: 'มีเรื่องขุ่นใจค้างอยู่ โกรธได้ ไม่ผิดเลย แค่อย่าเก็บไว้นานนะ' },
      { word: 'โกรธมาก', body: 'ความโกรธกำลังหนักในใจ ไม่ต้องเก็บไว้ทำร้ายตัวเอง' },
    ],
    way: 'let-go',
    release: 'ปล่อยความโกรธลอยไปกับกระทง ใจจะได้เบาลง',
    fact: 'หนามของกุหลาบช่วยกันไม่ให้สัตว์มากินต้น',
    wish: 'ขอให้เรื่องที่ทำให้ขุ่นใจ ลอยห่างออกไปเรื่อย ๆ',
    named: true,
  },
  {
    id: 'gerbera',
    emotion: 'excited',
    emotionWord: 'ความตื่นเต้น',
    tint: 3,
    name: 'เยอบีร่าสีส้ม',
    body: 'สำหรับใจที่ตื่นเต้นกับสิ่งที่รออยู่',
    levels: [
      { word: 'ตื่นเต้นนิด ๆ', body: 'มีอะไรบางอย่างรออยู่ข้างหน้า ใจเลยเต้นแรงขึ้นนิดนึง' },
      { word: 'ตื่นเต้นสุด ๆ', body: 'ใจคุณพร้อมพุ่งไปข้างหน้าเต็มที่ พลังแบบนี้มีค่ามาก' },
    ],
    way: 'pass-on',
    release: 'พลังนี้ส่งต่อได้ ชวนเพื่อนไปด้วยกันนะ',
    fact: 'เยอบีร่าหนึ่งดอก จริง ๆ คือดอกเล็ก ๆ หลายร้อยดอกรวมกัน',
    wish: 'ขอให้สิ่งใหม่ที่รออยู่ เป็นเรื่องดี',
    named: true,
  },
  {
    id: 'lavender',
    emotion: 'worried',
    emotionWord: 'ความกังวล',
    tint: 4,
    name: 'ลาเวนเดอร์สีม่วง',
    body: 'สำหรับใจที่กังวลอยู่',
    levels: [
      { word: 'กังวลอยู่บ้าง', body: 'มีเรื่องวนอยู่ในหัวบ้าง เป็นเรื่องปกติ ลองหายใจลึก ๆ สักที' },
      { word: 'กังวลมาก', body: 'หัวคุณคิดไม่หยุดเลยตอนนี้ ไม่ต้องแก้ทุกเรื่องคืนนี้ก็ได้นะ' },
    ],
    way: 'let-go',
    release: 'ฝากความกังวลลอยไปกับกระทง แล้วพักใจสักหน่อย',
    fact: 'คนนิยมใช้กลิ่นลาเวนเดอร์ เวลาอยากผ่อนคลาย',
    wish: 'ขอให้คืนนี้หลับสบาย ไม่มีเรื่องวนในหัว',
    named: true,
  },
  {
    id: 'pink-tulip',
    emotion: 'love',
    emotionWord: 'ความรัก',
    tint: 5,
    name: 'ทิวลิปสีชมพู',
    body: 'สำหรับใจที่มีใครบางคนอยู่ในนั้น',
    levels: [
      { word: 'คิดถึงใครบางคน', body: 'มีใครบางคนอยู่ในใจ ความรู้สึกแบบนี้น่ารักดีนะ' },
      { word: 'รักเต็มหัวใจ', body: 'ใจคุณเต็มไปด้วยความรัก เป็นเรื่องที่ดีมาก ๆ' },
    ],
    way: 'pass-on',
    release: 'ความรักไม่ต้องลอยทิ้ง บอกคนที่คิดถึงสักคำนะ',
    fact: 'ทิวลิปยังยืดตัวยาวขึ้นได้อีก แม้ตัดมาใส่แจกันแล้ว',
    wish: 'ขอให้ความรู้สึกดี ๆ ไปถึงคนที่คุณคิดถึง',
    named: true,
  },
];

/** The flower for a feeling. */
export const flowerFor = (emotion: Emotion): Flower => loykrathongFlowers.find((f) => f.emotion === emotion)!;

/**
 * The booth quiz, from the student council (2026-11-16): five questions set on a
 * Loy Krathong night, each with six answers, one for each feeling. The wording is
 * the council's, shortened where a line was long to read standing in a queue;
 * which feeling each answer points to is exactly theirs. The answer order is
 * theirs too, so a feeling is never always in the same place.
 *
 * Every choice's `id` is its feeling, so what is stored ("q2" → "love") reads
 * plainly in the admin panel and the recap.
 *
 * On the kiosk each answer is a slip of paper: tap it, or flick it up, and it
 * floats away (components/booth/FloatChoices). `scene` is the small picture each
 * question's slips carry. On a phone they are taps (app/(student)/booth).
 */
export type BoothScene = 'krathong' | 'candle' | 'drift' | 'sunrise' | 'river';

export interface BoothChoice {
  id: Emotion;
  label: string;
  /** The answer's position in the council's list (ก = 0). Carries no meaning. */
  value: number;
  /** The picture beside the answer where it is a tap (the phone). Carries no meaning. */
  mark: ChoiceMark;
}

export interface BoothQuestion {
  id: string;
  headline: string;
  note: string;
  scene: BoothScene;
  choices: BoothChoice[];
}

const MARKS: ChoiceMark[] = ['circle', 'square', 'leaf', 'drop', 'circle', 'square'];
const choices = (list: [Emotion, string][]): BoothChoice[] =>
  list.map(([id, label], i) => ({ id, label, value: i, mark: MARKS[i] }));

export const loykrathongQuiz: BoothQuestion[] = [
  {
    id: 'q1',
    scene: 'krathong',
    note: 'ข้อ 1 จาก 5 · ไม่มีถูกผิด',
    headline: 'คืนนี้ลอยกระทง อยากฝากอะไร ลอยไปด้วย?',
    choices: choices([
      ['sad', 'ความทุกข์ใจ'],
      ['happy', 'คำขอบคุณ'],
      ['angry', 'ความแค้น'],
      ['excited', 'ความคาดหวัง'],
      ['worried', 'ความเครียด'],
      ['love', 'ความห่วงใย'],
    ]),
  },
  {
    id: 'q2',
    scene: 'candle',
    note: 'ข้อ 2 จาก 5',
    headline: 'จุดเทียนอธิษฐาน ขอพรว่าอะไร?',
    choices: choices([
      ['angry', 'ให้คนที่ทำเราเจ็บ หายไปเสียที'],
      ['love', 'ให้สมหวังในความรัก'],
      ['sad', 'ให้ใครบางคนกลับมาหาเรา'],
      ['excited', 'ให้ได้เจอสิ่งใหม่ ๆ'],
      ['worried', 'ให้งานเสร็จสักที'],
      ['happy', 'ให้ตัวเองมีความสุข'],
    ]),
  },
  {
    id: 'q3',
    scene: 'drift',
    note: 'ข้อ 3 จาก 5',
    headline: 'มองกระทง ลอยห่างออกไป ใจรู้สึกยังไง?',
    choices: choices([
      ['happy', 'โล่ง ใจเบา ยิ้มออก'],
      ['angry', 'ยังขุ่น อยากให้ลอยพ้นตาไปสักที'],
      ['sad', 'ใจหาย อยากให้ลอยกลับมา'],
      ['excited', 'จะลอยไปไกลแค่ไหนนะ'],
      ['worried', 'จะจมมั้ยหว่า'],
      ['love', 'ลอยไปหาคนที่คิดถึงด้วยนะ'],
    ]),
  },
  {
    id: 'q4',
    scene: 'sunrise',
    note: 'ข้อ 4 จาก 5',
    headline: 'ตื่นมาพรุ่งนี้ เปลี่ยนได้หนึ่งอย่าง อยากให้เป็นอะไร?',
    choices: choices([
      ['angry', 'ความเกลียดชังหายไป'],
      ['sad', 'ใจไม่หนักกับเรื่องที่แบกอยู่'],
      ['happy', 'ทุกคนตื่นมามีความสุข'],
      ['excited', 'มีโอกาสใหม่ ๆ รออยู่'],
      ['worried', 'ปัญหาและความเครียดหายไป'],
      ['love', 'คนที่รักอยู่ด้วยกันไปตลอด'],
    ]),
  },
  {
    id: 'q5',
    scene: 'river',
    note: 'ข้อ 5 จาก 5 · ข้อสุดท้าย',
    headline: 'นั่งริมแม่น้ำเงียบ ๆ คนเดียว จะคิดถึงอะไร?',
    choices: choices([
      ['happy', 'ช่วงเวลาดี ๆ ที่ผ่านมา'],
      ['angry', 'เรื่องที่ไม่พอใจ วนซ้ำไปมา'],
      ['sad', 'ช่วงเวลาที่ย้อนกลับไปไม่ได้'],
      ['excited', 'แผนที่อยากทำวันต่อไป'],
      ['worried', 'ฟุ้งซ่าน คิดไปทุกเรื่อง'],
      ['love', 'ใจลอยไปหาใครบางคน'],
    ]),
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
 * The honest "โอเคไหม" question. NO LONGER ASKED (2026-11-16): the council's
 * five questions replaced the whole quiz. Kept so answers stored before then
 * still read correctly in the admin panel, the recap and the TV's guarded total
 * (lib/booth-wall.ts), which simply stays hidden while nobody answers it.
 */
export const okayQuestion: OkayQuestion = {
  id: 'ok',
  note: 'ข้อสุดท้าย · ไม่มีผลกับดอกไม้',
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
 * The bridge from the booth to the main site, shown beside a QR code on the TV and
 * on the kiosk's result. The booth is the quick part; the deeper questions are on
 * the site, for later, in a student's own time.
 */
export const qrInvite = {
  title: 'อยากรู้ว่าใจจริง ๆ เป็นยังไง?',
  body: 'สแกนเก็บไว้ เช็กใจตอนว่าง ๆ',
} as const;

/** One stored answer: a question and the choice picked. */
export interface BoothPick {
  questionId: string;
  choiceId: string;
}

/** A booth result: the flower, how strong the feeling was, and how each feeling scored. */
export interface BoothResult {
  flower: Flower;
  /** 0 a little (1–2 of 5 answers), 1 a lot (3 or more). */
  level: 0 | 1;
  /** How many of the answers pointed at this feeling. */
  score: number;
  /** How many questions there were. */
  of: number;
  scores: Record<Emotion, number>;
}

/** The answers as one feeling per question, in quiz order, or null unless each was answered once. */
export function emotionsFromChoices(pairs: BoothPick[]): Emotion[] | null {
  const picks: Emotion[] = [];
  for (const question of loykrathongQuiz) {
    const matches = pairs.filter((p) => p.questionId === question.id);
    if (matches.length !== 1) return null;
    const choice = question.choices.find((c) => c.id === matches[0].choiceId);
    if (!choice) return null;
    picks.push(choice.id);
  }
  return picks;
}

/** Three or more of five answers for one feeling is the strong level. */
export const STRONG_FROM = 3;

/**
 * A gentle lean, so the flowers come out more evenly at the booth (2026-11-19):
 * sunflowers were coming out most, so a tie goes to the rose, gerbera or tulip
 * first, and happy needs a clear lead to win. A real majority always still wins
 * (2 of 5 beats 1, whatever the lean).
 */
const LEAN: Partial<Record<Emotion, number>> = { angry: 1.15, excited: 1.15, love: 1.15, worried: 0.93, happy: 0.85 };

/**
 * The result for a set of answers. Deterministic, so the server can recompute it
 * from what it stored (BRIEF §3) and never has to trust the client.
 *
 * The feeling with the most answers wins. On a tie, the one answered LATEST wins:
 * the later questions (by the river, alone) are the most telling.
 */
export function resultFromEmotions(picks: Emotion[]): BoothResult {
  const scores = Object.fromEntries(EMOTIONS.map((e) => [e, 0])) as Record<Emotion, number>;
  for (const e of picks) scores[e] += 1;
  const weighed = (e: Emotion) => scores[e] * (LEAN[e] ?? 1);
  const best = Math.max(...EMOTIONS.map(weighed));
  const winner = [...picks].reverse().find((e) => weighed(e) === best) ?? picks[picks.length - 1];
  const top = scores[winner];
  return { flower: flowerFor(winner), level: top >= STRONG_FROM ? 1 : 0, score: top, of: picks.length, scores };
}

/** The result for stored answers, or null unless every quiz question is answered once. */
export function resultFromChoices(pairs: BoothPick[]): BoothResult | null {
  const picks = emotionsFromChoices(pairs);
  return picks ? resultFromEmotions(picks) : null;
}

/**
 * The flower for a set of stored answers (question id + choice id). This is what
 * the server runs to recompute a booth result from what it saved (BRIEF §3).
 * Answers to questions outside the quiz (the old okayQuestion) are ignored.
 */
export function flowerFromChoices(pairs: BoothPick[]): Flower | null {
  return resultFromChoices(pairs)?.flower ?? null;
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
      lead: 'เล่น 5 ข้อ รับเลย',
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
  idleBody: 'ตอบ 5 ข้อสั้น ๆ คืนลอยกระทง แล้วดูว่าใจวันนี้ได้ดอกไม้อะไร เอาไปแต่งกระทงได้เลย',
  idleAction: 'เริ่มเลย',
  resultNote: 'ใจวันนี้ของคุณ',
  /** Above the flower's name on the result. */
  flowerFor: 'ดอกไม้สำหรับใจนี้',
  /** Under each question: how to answer. */
  floatHint: 'แตะ หรือปัดขึ้น ให้คำตอบลอยไป',
  /** The result: how many answers pointed at the feeling. */
  scoreLine: (n: number, of: number) => `${n} จาก ${of} คำตอบบอกแบบนี้`,
  /** Above the release line: let it float away, or pass it on. */
  letGo: 'ลอยมันไปกับกระทง',
  passOn: 'ส่งต่อให้คนอื่น',
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
