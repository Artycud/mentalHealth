/**
 * The พี่สภา team's side of ระบาย: their login, their inbox (app/sapa), and the
 * admin card that makes their shared password (app/admin/SapaAccountCard).
 *
 * DRAFT: the answering guide below must be agreed with CUD Care and the council's
 * teacher before students use ระบาย: what a พี่ does when a message means danger,
 * and who they tell.
 */

/** A พี่'s nickname as the student and the team see it: "พี่อาร์ตี้" (no double พี่). */
export const phi = (name: string) => (name.startsWith('พี่') ? name : `พี่${name}`);

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

  /** Asked once per device, before the inbox: who is answering. */
  name: {
    title: 'ก่อนเริ่ม พี่ชื่ออะไร?',
    body: 'น้องจะเห็นชื่อนี้ในข้อความที่พี่ตอบ เช่น "พี่อาร์ตี้" และทีมจะเห็นว่าใครรับเรื่องไหน ใครช่วยตอบไปเท่าไหร่',
    placeholder: 'ชื่อเล่น เช่น อาร์ตี้',
    save: 'เริ่มตอบ',
    you: (name: string) => `คุณคือ ${phi(name)}`,
    change: 'เปลี่ยนชื่อ',
  },

  inbox: {
    empty: 'ยังไม่มีใครระบายมา',
    emptyTab: 'ไม่มีแชทในแท็บนี้',
    tabs: { waiting: 'รอตอบ', answered: 'ตอบแล้ว', mine: 'ของฉัน' },
    waiting: 'รอพี่ตอบ',
    answered: 'ตอบแล้ว',
    urgent: 'ด่วน',
    waited: (min: number) => (min < 1 ? 'เพิ่งส่งมา' : min < 60 ? `รอ ${min} นาที` : `รอ ${Math.floor(min / 60)} ชม. ${min % 60} นาที`),
    open: 'เลือกแชทเพื่ออ่านและตอบ',
    gone: 'แชทนี้จบไปแล้ว น้องลบข้อความหมดแล้ว',
    placeholder: 'ตอบแบบพี่คุยกับน้อง ฟังก่อน ไม่ตัดสิน ไม่ต้องรีบสอน',
    send: 'ส่งถึงน้อง',
    sending: 'กำลังส่ง…',
    failed: 'ส่งไม่สำเร็จ ลองใหม่อีกที',
    notify: 'เปิดแจ้งเตือน',
    notifyOn: 'แจ้งเตือนเปิดอยู่',
    logout: 'ออกจากระบบ',
    back: 'กลับไปรายการ',
    student: 'น้อง',
    you: 'คุณ',
    team: 'พี่สภา',
    feel: (word: string) => `มาจากเช็กใจ: ${word}`,
    count: (n: number) => `${n} ข้อความ`,
    newMessage: 'มีน้องระบายมาใหม่',
    // Who is looking after a chat: one พี่ takes it on, anyone can still answer.
    claim: 'รับเรื่องนี้',
    release: 'ปล่อยเรื่องนี้',
    takeOver: (name: string) => `รับต่อจาก${phi(name)}`,
    takeOverAsk: (name: string) => `${phi(name)} ดูแลแชทนี้อยู่ รับต่อเลยไหม?`,
    claimedBy: (name: string) => `${phi(name)} ดูแลอยู่`,
    mine: 'คุณดูแลแชทนี้อยู่',
    unclaimed: 'ยังไม่มีใครรับ',
    typingStudent: 'น้องกำลังพิมพ์',
    typingSapa: (name: string) => `${phi(name)} กำลังพิมพ์`,
    stats: (waiting: number, answered: number) => `รอตอบ ${waiting} · ตอบแล้ว ${answered}`,
    today: 'วันนี้ช่วยกันตอบ',
    replies: (n: number) => `${n} ข้อความ`,
    guideTitle: 'แนวทางการตอบ',
  },

  /** One tap fills the reply box, to send as it is or to make your own. */
  quick: [
    'พี่เข้าใจเลยว่ามันหนัก ไม่แปลกเลยที่จะรู้สึกแบบนี้',
    'เหนื่อยก็พักก่อนได้นะ ไม่ต้องฝืนตลอดเวลาก็ได้',
    'มีตรงไหนที่ไม่สบายใจแล้วอยากระบายให้พี่ฟังได้เลยนะ',
  ],

  /** Always beside the reply box. DRAFT: needs CUD Care's approval. */
  guide: [
    'ฟังก่อน ไม่ต้องรีบแก้ปัญหา บอกน้องว่าพี่ได้ยินอะไร',
    'ไม่ถามชื่อ ไม่ถามห้อง ไม่ชวนไปคุยที่อื่น',
    'ถ้าน้องพูดถึงการทำร้ายตัวเองหรือมีอันตราย ส่ง CUD Care / สายด่วน 1323 ให้น้อง และแจ้งครูที่ดูแลทันที',
  ],

  admin: {
    heading: 'พี่สภา (ตอบระบาย)',
    hint: 'รหัสเดียวสำหรับทีมพี่สภาที่ตอบข้อความในหน้า /sapa สร้างรหัสใหม่เมื่อไหร่ ทุกคนในทีมต้องเข้าสู่ระบบใหม่',
    generate: 'สุ่มรหัสใหม่ให้',
    choose: 'หรือตั้งรหัสเอง',
    chooseHint: 'อย่างน้อย 8 ตัว ไม่มีเว้นวรรคหน้าหลัง',
    save: 'ตั้งรหัสนี้',
    saved: 'ตั้งรหัสทีมแล้ว ส่งให้ทีมได้เลย ทุกคนต้องเข้าสู่ระบบใหม่',
    badPassword: 'รหัสต้องยาวอย่างน้อย 8 ตัว และไม่มีเว้นวรรคหน้าหลัง',
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
    test: 'ทดสอบแจ้งเตือน Discord',
    testing: 'กำลังส่ง…',
    testResult: {
      ok: 'ส่งแล้ว ✓ ไปดูในช่อง Discord ได้เลย',
      not_set: 'เซิร์ฟเวอร์ยังไม่เห็น DISCORD_WEBHOOK_URL: เช็กว่าตั้งใน Vercel ให้ Production แล้ว และกด Redeploy หลังตั้ง',
      bad_url: 'URL ของ webhook ไม่ถูกต้อง: ต้องขึ้นต้นด้วย https://discord.com/api/webhooks/ คัดลอกใหม่จาก Discord ให้ครบ',
      not_found: 'Discord บอกว่าไม่มี webhook นี้แล้ว (ถูกลบ หรือคัดลอกไม่ครบ): สร้างใหม่แล้ววาง URL ใหม่',
      refused: 'Discord ไม่รับข้อความ',
      unreachable: 'ติดต่อ Discord ไม่ได้ ลองใหม่อีกที',
    },
  },
} as const;
