/**
 * The booth recap: two Instagram story cards made from the day's anonymous totals,
 * on the admin's recap page (app/admin/recap). DRAFT copy, for council review.
 *
 * Every number on a card is computed (lib/recap.ts); nothing here states a fact of
 * its own. Card 2 is about mental health and goes out in public, so it normalises
 * ("ไม่ได้มีแค่คุณคนเดียว") and carries the CUD Care line (§12).
 * Kept short on purpose: one idea per block, no explaining.
 */

export const recap = {
  // ---- the page ----
  title: 'สรุปบูธลง IG',
  intro: 'การ์ดสตอรี่จากข้อมูลจริง (ไม่ระบุตัวตน) กด "แชร์" บนมือถือเพื่อส่งเข้า Instagram หรือกด "บันทึกรูป"',
  back: 'กลับหน้าแอดมิน',
  dayLabel: 'วัน',
  allDays: 'ทุกวันของบูธ',
  share: 'แชร์',
  save: 'บันทึกรูป',
  loading: 'กำลังวาด…',
  noData: 'ยังไม่มีคนเล่นบูธจนจบในวันนี้ ยังทำสรุปไม่ได้',
  topicHidden: (min: number) =>
    `"เรื่องที่อยู่ในหัวมากสุด" จะขึ้นเมื่อมีคนเช็กใจบนเว็บแล้วเลือกเรื่องอย่างน้อย ${min} คน (เริ่มนับ 16 พ.ย.)`,
  ventHidden: (min: number) => `ตัวเลขของระบายจะขึ้นเมื่อมีอย่างน้อย ${min} แชทในวันนั้น`,
  sticker: 'กรอบประในการ์ดที่ 2 คือที่วางสติกเกอร์ลิงก์ของ IG (กรอบไม่ติดไปในรูป)',
  sample: 'ตัวอย่าง: ตัวเลขสมมติ ห้ามโพสต์',
  noBooth: 'ยังไม่มีบูธที่เปิดอยู่',
  cards: ['ใจวันนี้', 'ใจที่แบกอยู่ + ระบาย'],

  // ---- on the cards ----
  brand: 'CUD Mental Health Week',
  day: (festival: string, date: string) => `สรุปบูธ${festival} · ${date}`,
  today: {
    players: (oneDay: boolean) => (oneDay ? 'คนเล่นแล้ววันนี้' : 'คนเล่นที่บูธ'),
    feelings: 'ใจส่วนใหญ่ตอนนี้',
    of: 'ของคนที่มาเล่น',
    flower: (name: string) => `ได้${name}`,
    quotes: { q1: 'อยากฝากลอยไปกับกระทง', q4: 'ถ้าพรุ่งนี้เปลี่ยนได้หนึ่งอย่าง' } as Record<string, string>,
    topic: (name: string) => `เรื่องที่อยู่ในหัวมากสุดบนเว็บ · ${name}`,
  },
  heavy: {
    note: 'เรื่องใจ',
    stat: (n: number) => `${n} ใน 10 คน`,
    line: 'ใจกำลังแบกอะไรบางอย่างอยู่',
    which: 'ได้ดอกไม้ของความกังวล ความเศร้า หรือความโกรธ',
    tail: 'ไม่โอเคก็ได้นะ ไม่ได้มีแค่คุณคนเดียว',
  },
  vent: {
    title: 'ระบายให้พี่สภาฟัง',
    sub: 'มีอะไรกวนใจอยู่ไหม พิมพ์มาได้เลย',
    chats: (n: number, oneDay: boolean) => `${oneDay ? 'วันนี้' : 'ช่วงบูธ'}ทักมาระบาย ${n} แชท`,
    reply: (min: number) => (min < 1 ? 'ได้คำตอบในไม่ถึงนาที' : `ได้คำตอบภายในราว ${min} นาที`),
    promise: 'พี่ๆ สภาตอบเอง · ตอบไวสุด 3 นาที',
    scan: 'สแกนเข้าเว็บ',
    scanSub: 'เช็กใจ หรือระบายก็ได้',
  },
} as const;
