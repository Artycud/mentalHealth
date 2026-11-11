/**
 * The booth recap: Instagram cards made from the day's anonymous totals, on the
 * admin's recap page (app/admin/recap). DRAFT copy, for council review.
 *
 * Every number on a card is computed (lib/recap.ts); nothing here states a fact of
 * its own. The honest-question card is about mental health and goes out in public,
 * so it normalises ("ไม่ได้มีแค่คุณคนเดียว") and carries the CUD Care line (§12).
 */

export const recap = {
  // ---- the page ----
  title: 'สรุปบูธลง IG',
  intro:
    'การ์ดสรุปจากข้อมูลจริงของบูธ (ไม่ระบุตัวตน) กด "แชร์" บนมือถือเพื่อส่งเข้า Instagram ได้เลย หรือกด "บันทึกรูป"',
  back: 'กลับหน้าแอดมิน',
  dayLabel: 'วัน',
  allDays: 'ทุกวันของบูธ',
  formatLabel: 'ขนาด',
  story: 'สตอรี่ 9:16',
  post: 'โพสต์ 4:5',
  share: 'แชร์',
  save: 'บันทึกรูป',
  loading: 'กำลังวาด…',
  noData: 'ยังไม่มีคนเล่นบูธจนจบในวันนี้ ยังทำสรุปไม่ได้',
  okayHidden: (min: number) => `การ์ดเรื่อง "โอเคไหม" จะขึ้นเมื่อมีคนตอบข้อนี้อย่างน้อย ${min} คน เพื่อไม่ให้ตัวเลขชี้ไปถึงใครได้`,
  sample: 'ตัวอย่าง: ตัวเลขสมมติ ห้ามโพสต์',
  noBooth: 'ยังไม่มีบูธที่เปิดอยู่',

  // ---- on the cards ----
  brand: 'CUD Mental Health Week',
  cover: {
    note: (festival: string) => `สรุปบูธ${festival}`,
    players: 'คนมาเล่นที่บูธ',
    time: (seconds: number) =>
      seconds < 90 ? `ใช้เวลาเล่นราว ๆ ${seconds} วินาที` : `ใช้เวลาเล่นราว ๆ ${(seconds / 60).toFixed(1)} นาที`,
    peak: (from: string, to: string) => `คนเยอะสุดช่วง ${from}–${to} น.`,
    thanks: 'ขอบคุณทุกคนที่แวะมานะ',
  },
  flowers: {
    note: 'ดอกไม้ของวันนี้',
    top: 'ดอกที่ออกมากที่สุด',
    share: (pct: number) => `${pct}% ของคนที่มาเล่น`,
  },
  answers: {
    note: 'คนส่วนใหญ่ตอบว่า…',
  },
  okay: {
    note: 'เรื่องที่อยากชวนคิด',
    question: 'ถ้ามีคนถามว่า "โอเคไหม"',
    stat: (n: number) => `${n} ใน 10 คน`,
    statLine: 'บอกว่าโอเค ทั้งที่จริง ๆ ไม่ค่อยโอเค',
    depends: (n: number) => `อีก ${n} ใน 10 คน ตอบว่า "แล้วแต่ว่าใครถาม"`,
    tail: 'ไม่โอเคก็ได้นะ ไม่ได้มีแค่คุณคนเดียว',
    base: (n: number) => `จากคนที่ตอบข้อนี้ ${n} คน · ไม่ระบุตัวตน`,
  },
  invite: {
    note: 'ต่อจากบูธ',
    title: 'อยากรู้ว่าใจจริง ๆ เป็นยังไง?',
    body: 'สแกนแล้วเช็กใจตอนว่าง ๆ ได้เลย',
    next: (name: string, date: string) => `บูธหน้า: ${name} · ${date}`,
  },
} as const;
