/**
 * The พี่สภา team's side of ระบาย: their login, their inbox (app/sapa), and the
 * admin card that makes their shared password (app/admin/SapaAccountCard).
 *
 * DRAFT: the answering guide below must be agreed with CUD Care and the council's
 * teacher before students use ระบาย: what a พี่ does when a message means danger,
 * and who they tell.
 */

export const sapa = {
  title: 'กล่องระบาย · พี่สภา',

  login: {
    title: 'พี่สภา เข้าสู่ระบบ',
    note: 'ใส่รหัสทีมที่แอดมินให้ไว้',
    password: 'รหัสทีม',
    submit: 'เข้าสู่ระบบ',
    working: 'กำลังเข้า…',
    wrong: 'รหัสไม่ถูก',
    locked: 'ใส่ผิดหลายครั้ง รอ 10 นาทีแล้วลองใหม่',
    notReady: 'แอดมินยังไม่ได้สร้างรหัสทีม',
    network: 'เชื่อมต่อไม่ได้ ลองใหม่อีกที',
  },

  inbox: {
    empty: 'ยังไม่มีใครระบายมา',
    waiting: 'รอพี่ตอบ',
    answered: 'ตอบแล้ว',
    urgent: 'ด่วน',
    open: 'เลือกแชทเพื่ออ่านและตอบ',
    gone: 'แชทนี้จบไปแล้ว น้องลบข้อความหมดแล้ว',
    placeholder: 'ตอบแบบพี่คุยกับน้อง ฟังก่อน ไม่ตัดสิน ไม่ต้องรีบสอน',
    send: 'ส่งถึงน้อง',
    sending: 'กำลังส่ง…',
    failed: 'ส่งไม่สำเร็จ ลองใหม่อีกที',
    notify: 'เปิดแจ้งเตือนในเครื่องนี้',
    notifyOn: 'แจ้งเตือนในเครื่องนี้เปิดอยู่',
    logout: 'ออกจากระบบ',
    back: 'กลับไปรายการ',
    student: 'น้อง',
    you: 'พี่สภา',
    feel: (word: string) => `มาจากเช็กใจ: ${word}`,
    count: (n: number) => `${n} ข้อความ`,
    newMessage: 'มีน้องระบายมาใหม่',
  },

  /** Always beside the reply box. DRAFT: needs CUD Care's approval. */
  guide: [
    'ฟังก่อน ไม่ต้องรีบแก้ปัญหา บอกน้องว่าพี่ได้ยินอะไร',
    'ไม่ถามชื่อ ไม่ถามห้อง ไม่ชวนไปคุยที่อื่น',
    'ถ้าน้องพูดถึงการทำร้ายตัวเองหรือมีอันตราย ส่ง CUD Care / สายด่วน 1323 ให้น้อง และแจ้งครูที่ดูแลทันที',
  ],

  admin: {
    heading: 'พี่สภา (ตอบระบาย)',
    hint: 'รหัสเดียวสำหรับทีมพี่สภาที่ตอบข้อความในหน้า /sapa สร้างรหัสใหม่เมื่อไหร่ ทุกคนในทีมต้องเข้าสู่ระบบใหม่',
    generate: 'สร้างรหัสทีมใหม่',
    confirmGenerate: 'สร้างรหัสใหม่? ทุกคนในทีมต้องเข้าสู่ระบบใหม่',
    isSet: 'มีรหัสแล้ว',
    changedAt: 'เปลี่ยนล่าสุด',
    newPassword: 'รหัสทีมใหม่:',
    shownOnce: 'แสดงครั้งเดียว จดหรือส่งให้ทีมตอนนี้เลย',
    discord: {
      bot: 'Discord: แจ้งเตือน และตอบใน Discord ได้',
      webhook: 'Discord: แจ้งเตือนอย่างเดียว (ตอบในเว็บ)',
      none: 'Discord: ยังไม่ได้ตั้งค่า ดูวิธีใน docs/sapa.md',
    },
    open: 'เปิดกล่องระบาย',
  },
} as const;
