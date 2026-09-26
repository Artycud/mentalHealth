/**
 * "ใจวันนี้" as a guided check-up (User Mode).
 *
 * Two questions shape a heart: how much charge is left (energy) and how much is
 * being carried (weight). They are asked through things every student knows (a
 * phone battery, a school bag), so answering is a small moment of noticing, not
 * a test. The heart only takes its colour once both are answered; the result says
 * where it sits, a few words for it, and something true and interesting about it.
 *
 * On the home the same two questions are asked inside the scroll story
 * (content/th/story.ts); this is the standalone /checkup page.
 *
 * Voice (BRIEF §10): a friend, not an app. Nothing here is stored.
 * Everything below is a DRAFT awaiting council review.
 */

export const checkup = {
  meet: {
    note: 'เช็กใจวันนี้',
    title: 'นี่คือใจของเธอตอนนี้',
    body: 'ยังไม่มีสี เพราะยังไม่มีใครถามมันเลย ตอบ 2 คำถาม แล้วดูว่าวันนี้ใจเธอสีอะไร และมันกำลังบอกอะไรอยู่',
    go: 'ถามใจเลย',
  },

  energy: {
    note: 'คำถามที่ 1',
    title: 'ถ้าใจเป็นแบตมือถือ ตอนนี้เหลือเท่าไหร่?',
    hint: 'ลากไปซ้ายหรือขวา',
    ends: { low: 'ใกล้หมด', high: 'เต็มหลอด' },
    /** Low, middle, high — said the way a phone would. */
    anchors: [
      'เปิดโหมดประหยัดพลังงานอยู่',
      'ใช้ได้ แต่อย่าเพิ่งเปิดอะไรหนัก ๆ',
      'ชาร์จเต็ม พร้อมลุย',
    ],
    go: 'ประมาณนี้',
  },

  weight: {
    note: 'คำถามที่ 2',
    title: 'เรื่องที่แบกอยู่ในหัววันนี้ หนักแค่ไหน?',
    hint: 'ลากขึ้นหรือลง',
    ends: { light: 'โล่ง', heavy: 'หนักอึ้ง' },
    /** Light, middle, heavy — as a school bag. */
    anchors: [
      'เหมือนกระเป๋าวันไม่มีเรียน',
      'เหมือนกระเป๋าวันธรรมดา',
      'เหมือนกระเป๋าวันสอบ ครบทุกวิชา',
    ],
    go: 'ประมาณนี้',
  },

  whole: {
    note: 'ใจวันนี้',
    body: 'ยังไม่ตรงก็ขยับได้อีก ลากไปทางไหนก็ได้',
    go: 'ใช่แหละ',
  },

  topics: {
    note: 'ใจที่',
    title: 'อะไรกินพื้นที่ในหัวเยอะที่สุดวันนี้?',
    body: 'เลือกได้หลายอัน หรือไม่เลือกก็ได้',
    options: ['เรื่องเรียน', 'เพื่อน', 'ที่บ้าน', 'ความรัก', 'การนอน', 'โซเชียล', 'อนาคต', 'ตัวเอง'],
    go: 'ต่อ',
    none: 'ไม่มีอะไรเป็นพิเศษ',
  },

  result: {
    note: 'ใจวันนี้ของเธอ',
    topicsLabel: 'เรื่องที่อยู่ในหัว',
    /** What to say, per row: light, in between, heavy. */
    lines: [
      'ใจเบาดีวันนี้ เก็บความรู้สึกนี้ไว้นะ',
      'ไม่ได้แย่ แต่ก็มีอะไรให้คิดอยู่บ้าง',
      'วันนี้ใจแบกอะไรไว้เยอะ ไม่ต้องแบกคนเดียวก็ได้นะ',
    ],
    /** The mood map: where the heart landed. */
    map: {
      title: 'ใจเธออยู่ตรงนี้',
      body: 'ทุกคนเดินไปมาบนแผนที่นี้ได้ทั้งวัน ไม่มีจุดไหนผิด',
      low: 'แบตน้อย',
      high: 'แบตเต็ม',
      light: 'โล่ง',
      heavy: 'หนัก',
    },
    factNote: 'รู้ไหม',
    factSource: 'ที่มา',
    /** Above the message chosen for their heart (content/th/heart.ts). */
    messageNote: (word: string) => `ถึงใจที่ "${word}"`,
    /** For the heaviest row: the next step is to say it out loud, to the AI. */
    vent: {
      note: 'ไม่ต้องเก็บไว้คนเดียว',
      title: 'เล่าให้ AI ฟังก่อนไหม',
      body: 'พิมพ์สิ่งที่ค้างอยู่ออกมา แล้วได้คำตอบจากสิ่งที่เขียนจริง ๆ ไม่เก็บข้อความ',
    },
    next: 'ลองต่อด้วยอันนี้ไหม',
    ways: {
      vent: { title: 'ระบายออกมา', body: 'พิมพ์สิ่งที่ค้างในใจ แล้วได้คำตอบจากสิ่งที่เขียนจริง ๆ' },
      checkin: { title: 'เช็กให้ละเอียดขึ้น', body: '8 คำถามเรื่องเรียน การนอน เพื่อน ที่บ้าน' },
      self: { title: 'รู้จักตัวเองอีกนิด', body: 'ตอบไม่กี่ข้อ แล้วดูว่าเป็นคนแบบไหน' },
    },
    /** A quiet way to a person, always there, never pushed. */
    care: 'อยากคุยกับคนจริง ๆ? CUD Care พร้อมฟัง',
    again: 'เช็กใหม่อีกรอบ',
    home: 'กลับหน้าแรก',
  },
} as const;
