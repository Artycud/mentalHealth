/**
 * ระบายให้พี่ๆ สภาฟัง: a student writes, and a พี่ from the student council
 * answers, a person, not an AI (components/vent/Vent, lib/vent/threads.ts).
 *
 * The words are kept only until the student ends the conversation (or 30 quiet
 * days); no name, class or device is kept with them. The page says so, plainly.
 * Voice (BRIEF §10): a friend, never a therapist.
 *
 * THE SAFETY COPY AND THE PROMISES BELOW ARE A DRAFT AND MUST BE APPROVED BY CUD
 * CARE AND THE COUNCIL before ระบาย goes live, together with the contact channels
 * and who on the council answers (BRIEF decisions table).
 */

export const vent = {
  back: 'กลับ',
  end: 'จบการคุย',
  /** "จบการคุย" deletes everything, so it asks once, in the page (never a pop-up). */
  endConfirm: { ask: 'ลบข้อความทั้งหมดเลยไหม?', yes: 'ลบเลย', no: 'ยังก่อน' },

  intro: {
    /** When they arrive from the check-up, the note names their heart today. */
    noteFromCheckup: (word: string) => `ใจที่ "${word}" วันนี้`,
    note: 'ระบายให้พี่ๆ สภาฟัง',
    body: 'พิมพ์มาได้เลย พี่ๆ สภานักเรียนจะอ่านและตอบเอง ไม่ใช่ AI อาจไม่ทันที แต่พี่ๆ ตอบแน่นอน',
    privacy: 'ไม่ต้องใส่ชื่อ · พี่ๆ ไม่รู้ว่าเป็นใคร · กดจบการคุยแล้วข้อความถูกลบหมด',
    /** Coming back from another phone. */
    haveCode: 'มีโค้ดแชทอยู่แล้ว?',
  },

  /**
   * The way in, on the home and at the top of an empty chat: the heart asks
   * first (a reply is easier to write than a blank box), a few starters can be
   * sent with one tap, and the reassurance sits beside the button.
   */
  invite: {
    /** What the heart asks, by the sky's mood (lib/sky-time). */
    ask: {
      morning: 'เมื่อคืนนอนพอไหม เช้านี้รู้สึกยังไงบ้าง',
      day: 'เรียนมาทั้งวัน เหนื่อยไหม เล่าให้ฟังหน่อยสิ',
      dusk: 'วันนี้เป็นไงบ้าง มีอะไรค้างอยู่ในใจไหม',
      night: 'ดึกแล้วนะ มีอะไรคิดอยู่หรือเปล่า',
    },
    /** Drift through the empty bar, one after another. */
    hints: ['เรื่องเรียน…', 'เพื่อน…', 'ที่บ้าน…', 'ไม่รู้สิ แค่เหนื่อย…'],
    /** One tap: the chat opens with this already sent. */
    starters: ['เครียดเรื่องเรียน', 'นอนไม่พอ', 'ทะเลาะกับเพื่อน', 'แค่เหนื่อย ๆ'],
    /** Says plainly who reads it, and what happens to it. */
    safe: 'พี่ๆ สภาอ่านเอง · ไม่ต้องใส่ชื่อ · กดจบแล้วลบหมด',
    orTap: 'หรือแตะอันนี้เลย',
  },

  composer: {
    placeholder: 'พิมพ์ตรงนี้ได้เลย…',
    send: 'ส่ง',
    max: 1200,
  },

  /** Above each message. */
  me: 'เธอเขียนว่า',
  sapa: 'พี่สภา',
  /** After the student's message, until a พี่ answers. */
  sent: 'ส่งถึงพี่ๆ แล้ว',
  waitingNote: 'พี่ๆ จะตอบเร็วที่สุด ถ้าดึกแล้วอาจเป็นพรุ่งนี้ ปิดหน้านี้ได้เลย กลับมาเปิดระบายอีกทีก็เห็นคำตอบ',

  /** The chat code: the way back in from another phone. */
  code: {
    label: 'โค้ดแชท',
    hint: 'จดไว้ถ้าจะเปิดจากเครื่องอื่น เครื่องนี้จำไว้ให้แล้ว',
    copy: 'คัดลอก',
    copied: 'คัดลอกแล้ว',
    ask: 'ใส่โค้ดแชทของเธอ',
    open: 'เปิดแชท',
    notFound: 'ไม่เจอแชทนี้ อาจจบไปแล้ว หรือโค้ดพิมพ์ผิด',
    cancel: 'ยกเลิก',
  },

  /** DRAFT: needs CUD Care's approval. Shown at once when a message may mean danger (the message still reaches the team, marked urgent). */
  care: {
    note: 'ขอบคุณที่เล่าให้ฟังนะ',
    title: 'เรื่องนี้ควรได้คุยกับคนจริง ๆ',
    body: 'สิ่งที่เธอเขียนมาฟังดูหนักมาก เธอไม่ต้องผ่านมันไปคนเดียว มีคนที่พร้อมฟังและช่วยได้ ตอนนี้เลยก็ได้',
    honest: 'พี่ๆ สภาจะเห็นข้อความนี้และตอบ แต่พี่ๆ ไม่ใช่ผู้เชี่ยวชาญ และไม่รู้ว่าเธอเป็นใคร จึงติดต่อกลับไปหาเธอเองไม่ได้ ถ้าตอนนี้ไม่ปลอดภัย โทรเลยนะ',
    cudCare: 'คุยกับ CUD Care',
    hotline: { label: 'สายด่วนสุขภาพจิต 1323', detail: 'โทรฟรี ตลอด 24 ชั่วโมง', tel: '1323' },
    emergency: { label: 'ถ้าอันตรายตอนนี้ โทร 1669', tel: '1669' },
    stay: 'ถ้ายังอยากเล่าต่อ ก็เล่าต่อได้นะ',
  },

  /** Their conversation is no longer there (ended elsewhere, or 30 quiet days). */
  gone: 'แชทเดิมจบไปแล้ว เริ่มเล่าใหม่ได้เลยนะ',
  failed: 'ส่งไม่สำเร็จ ข้อความยังอยู่ในช่อง ลองกดส่งอีกครั้งนะ',
  busy: 'ตอนนี้มีคนส่งเยอะ รอสักครู่แล้วลองใหม่นะ',
  full: 'แชทนี้ยาวมากแล้ว กดจบการคุยแล้วเริ่มใหม่ได้ ถ้าอยากคุยกับคนจริง ๆ ต่อ CUD Care ก็พร้อมฟัง',

  ended: {
    title: 'จบการคุยแล้ว ข้อความถูกลบหมดแล้ว',
    body: 'ขอบคุณที่เล่าให้พี่ๆ ฟังนะ อยากเล่าอีกเมื่อไหร่ก็กลับมาได้',
    again: 'เล่าเรื่องใหม่',
    home: 'กลับหน้าแรก',
    care: 'อยากคุยกับคนจริง ๆ? CUD Care',
  },
} as const;
