/**
 * ระบาย (VENT): the student writes, an AI answers what they actually wrote.
 *
 * It is a conversation, but it should never feel like opening a chatbot: the
 * heart listens, the AI's answer begins with the words of theirs it heard, and
 * nothing is kept. Voice (BRIEF §10): a friend, never a therapist.
 *
 * THE SAFETY COPY BELOW IS A DRAFT AND MUST BE APPROVED BY CUD CARE before VENT
 * goes live, together with the contact channels (BRIEF decisions table).
 */

export const vent = {
  back: 'กลับ',
  end: 'จบการคุย',

  intro: {
    /** When they arrive from the check-up, the note names their heart today. */
    noteFromCheckup: (word: string) => `ใจที่ "${word}" วันนี้`,
    note: 'ระบายอะไรสักอย่าง',
    title: 'มีอะไรค้างอยู่ในใจ เล่าให้ฟังได้นะ',
    body: 'พิมพ์ยาวหรือสั้นก็ได้ AI จะตอบจากสิ่งที่เธอเขียนจริง ๆ',
    privacy: 'ไม่ต้องใส่ชื่อใคร · ข้อความไม่ถูกเก็บไว้ ปิดหน้านี้แล้วหายหมด',
    samplesLabel: 'ไม่รู้จะเริ่มยังไง ลองจากนี่ก็ได้',
  },

  composer: {
    placeholder: 'พิมพ์ตรงนี้ได้เลย…',
    send: 'ส่ง',
    max: 800,
  },

  heard: 'ได้ยินว่า',
  listening: 'กำลังฟังอยู่',
  /** Shown in development only, so a template reply is never mistaken for the AI. */
  mock: 'โหมดทดสอบ: คำตอบนี้มาจากตัวอย่าง ไม่ใช่ AI จริง',

  /** A reply the AI marked as worth a gentle nudge toward a person. */
  concern: {
    body: 'ถ้าเรื่องนี้หนักเกินจะถือไว้คนเดียว คุยกับคนจริง ๆ ได้นะ',
    link: 'ดูช่องทางติดต่อ CUD Care',
  },

  /** DRAFT: needs CUD Care's approval. Shown instead of the AI when a message may mean danger. */
  care: {
    note: 'ขอบคุณที่เล่าให้ฟังนะ',
    title: 'เรื่องนี้ควรได้คุยกับคนจริง ๆ',
    body: 'สิ่งที่เธอเขียนมาฟังดูหนักมาก เธอไม่ต้องผ่านมันไปคนเดียว มีคนที่พร้อมฟังและช่วยได้ ตอนนี้เลยก็ได้',
    honest: 'ที่นี่เป็น AI ไม่มีใครอ่านข้อความนี้ และติดต่อกลับหาเธอไม่ได้',
    cudCare: 'คุยกับ CUD Care',
    hotline: { label: 'สายด่วนสุขภาพจิต 1323', detail: 'โทรฟรี ตลอด 24 ชั่วโมง', tel: '1323' },
    emergency: { label: 'ถ้าอันตรายตอนนี้ โทร 1669', tel: '1669' },
    stay: 'ถ้ายังอยากเล่าต่อ ก็เล่าต่อได้นะ',
  },

  unavailable: 'ตอนนี้ AI ยังตอบไม่ได้ ข้อความของเธอไม่ได้ถูกเก็บไว้',
  busy: 'ตอนนี้มีคนคุยเยอะ รอสักครู่แล้วลองใหม่นะ',
  retry: 'ลองส่งอีกครั้ง',

  /** After this many messages the conversation closes gently. */
  maxTurns: 12,
  capped: 'คุยกันมาเยอะแล้ววันนี้ พักใจสักหน่อยนะ ถ้ายังอยากคุยกับใคร CUD Care ก็พร้อมฟัง',

  ended: {
    title: 'ข้อความทั้งหมดหายไปแล้ว',
    body: 'ไม่มีใครเห็น ไม่มีอะไรถูกเก็บไว้ ขอบคุณที่เล่าให้ฟังนะ',
    again: 'คุยใหม่',
    home: 'กลับหน้าแรก',
    care: 'อยากคุยกับคนจริง ๆ? CUD Care',
  },
} as const;
