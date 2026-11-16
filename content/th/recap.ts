/**
 * The booth recap: two Instagram story cards made from the day's anonymous totals,
 * on the admin's recap page (app/admin/recap). DRAFT copy, for council review.
 *
 * Every number on a card is computed (lib/recap.ts); nothing here states a fact of
 * its own. The honest-question card is about mental health and goes out in public,
 * so it normalises ("ไม่ได้มีแค่คุณคนเดียว") and carries the CUD Care line (§12).
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
  okayHidden: (min: number) => `ตัวเลข "โอเคไหม" จะขึ้นเมื่อมีคนตอบอย่างน้อย ${min} คน เพื่อไม่ให้ชี้ไปถึงใครได้`,
  topicHidden: (min: number) => `"เรื่องที่อยู่ในหัวมากสุด" จะขึ้นเมื่อมีคนเช็กใจบนเว็บแล้วเลือกเรื่องอย่างน้อย ${min} คน`,
  ventHidden: (min: number) => `ตัวเลขของระบายจะขึ้นเมื่อมีอย่างน้อย ${min} แชทในวันนั้น`,
  sticker: 'กรอบประในการ์ดที่ 2 คือที่วางสติกเกอร์ลิงก์ของ IG (กรอบไม่ติดไปในรูป)',
  sample: 'ตัวอย่าง: ตัวเลขสมมติ ห้ามโพสต์',
  noBooth: 'ยังไม่มีบูธที่เปิดอยู่',
  cards: ['ใจวันนี้', 'โอเคไหม + ลิงก์'],

  // ---- on the cards ----
  brand: 'CUD Mental Health Week',
  day: (festival: string, date: string) => `สรุปบูธ${festival} · ${date}`,
  today: {
    players: 'คนมาเล่นที่บูธ',
    feelings: 'ใจของคนส่วนใหญ่ตอนนี้',
    topic: 'เรื่องที่อยู่ในหัวมากสุด',
  },
  okay: {
    question: 'ถ้ามีคนถามว่า “โอเคไหม”',
    stat: (n: number) => `${n} ใน 10 คน`,
    statLine: 'บอกว่าโอเค ทั้งที่ไม่ค่อยโอเค',
    tail: 'ไม่โอเคก็ได้นะ ไม่ได้มีแค่คุณคนเดียว',
    vent: 'ระบายให้พี่สภาฟังได้นะ',
    chats: (n: number, oneDay: boolean) => `${oneDay ? 'วันนี้' : 'ช่วงบูธ'}ทักมาระบาย ${n} แชท`,
    fast: 'ส่วนใหญ่ได้คำตอบใน 3 นาที',
    promise: 'พี่ๆ สภาตอบเอง · ตอบไวสุด 3 นาที',
    scan: 'สแกนเข้าเว็บ',
    scanSub: 'เช็กใจ หรือระบายก็ได้',
  },
} as const;
