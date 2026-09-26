/**
 * "ใจวันนี้" as a guided check-up (User Mode).
 *
 * The heart pad works, but dropped on someone cold it is a graph to answer. So
 * the check-up walks in: meet the heart (still colourless,
 * because nobody has asked it anything yet), then ask it one thing at a time —
 * energy, then weight — each with everyday anchors so the ends mean something.
 * Only when both are answered does the heart take its colour. Then, optionally,
 * where it is coming from, and what might help.
 *
 * Voice (BRIEF §10): a friend, not an app. Nothing here is stored.
 */

export const checkup = {
  skip: 'ข้าม',

  meet: {
    note: 'เช็กใจวันนี้',
    title: 'นี่คือใจของเธอตอนนี้',
    body: 'มันยังไม่มีสี เพราะยังไม่มีใครถามมันเลย ถามแค่ 2 เรื่อง ไม่มีถูกผิด',
    go: 'ถามเลย',
  },

  energy: {
    note: 'เรื่องแรก',
    title: 'ตอนนี้มีแรงเหลือแค่ไหน?',
    hint: 'ลากไปซ้ายหรือขวา',
    ends: { low: 'หมดแรง', high: 'เต็มแรง' },
    /** Low, middle, high — something everyone at school has felt. */
    anchors: [
      'แบบตื่นเช้าวันจันทร์ อยากนอนต่อ',
      'แบบบ่าย ๆ ไปได้เรื่อย ๆ',
      'แบบเลิกเรียนวันศุกร์ พร้อมไปต่อ',
    ],
    go: 'ประมาณนี้',
  },

  weight: {
    note: 'อีกเรื่อง',
    title: 'แล้วใจตอนนี้ เบาหรือหนัก?',
    hint: 'ลากขึ้นหรือลง',
    ends: { light: 'เบา', heavy: 'หนัก' },
    /** Light, middle, heavy. */
    anchors: [
      'แบบเพิ่งส่งงานเสร็จ โล่ง ๆ',
      'ไม่เบา ไม่หนัก',
      'แบบมีอะไรค้างอยู่ในอก',
    ],
    go: 'ประมาณนี้',
  },

  whole: {
    note: 'ใจวันนี้',
    body: 'ถ้ายังไม่ตรง ขยับได้อีก ลากไปทางไหนก็ได้',
    go: 'ใช่แหละ',
  },

  topics: {
    note: 'ใจที่',
    title: 'มาจากเรื่องไหนบ้าง?',
    body: 'เลือกได้หลายอัน หรือไม่เลือกก็ได้',
    options: ['เรื่องเรียน', 'เพื่อน', 'ที่บ้าน', 'ความรัก', 'การนอน', 'ตัวเอง', 'ไม่รู้เหมือนกัน'],
    go: 'ต่อ',
    none: 'ไม่มีอะไรเป็นพิเศษ',
  },

  result: {
    note: 'ใจวันนี้ของเธอ',
    topicsLabel: 'เรื่องที่อยู่ในใจ',
    /** What to say, per row: light, in between, heavy. Points at what they chose. */
    lines: [
      'ใจเบาดีวันนี้ เก็บความรู้สึกนี้ไว้นะ',
      'ไม่ได้แย่ แต่ก็มีอะไรให้คิดอยู่บ้าง',
      'วันนี้ใจแบกอะไรไว้เยอะ ไม่ต้องแบกคนเดียวก็ได้นะ',
    ],
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
