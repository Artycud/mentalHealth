/**
 * Thai labels for the admin panel (BRIEF §11).
 *
 * The panel is for the student council, so these are plain and direct, not the warm
 * voice of the student pages. Every word a person reads is here, never in a component.
 * Drafts awaiting council review, like the rest of the copy.
 */

import type { Mode, ResultState } from '@/lib/types';

/** The word that must be typed to wipe everything. Short enough to type on a phone. */
export const WIPE_WORD = 'ลบข้อมูลทั้งหมด';

export const admin = {
  title: 'ผู้ดูแล',
  signOut: 'ออกจากระบบ',
  backToSite: 'กลับไปหน้าเว็บ',

  login: {
    title: 'เข้าสู่ระบบผู้ดูแล',
    username: 'ชื่อผู้ใช้',
    password: 'รหัสผ่าน',
    submit: 'เข้าสู่ระบบ',
    working: 'กำลังตรวจสอบ…',
    wrong: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง',
    locked: 'ลองผิดหลายครั้งเกินไป ระบบล็อกไว้ชั่วคราว ลองใหม่อีกครั้งใน 10 นาที',
    notConfigured: 'ยังไม่ได้ตั้งค่าบัญชีผู้ดูแล เปิดหน้า /admin เพื่อตั้งค่าครั้งแรก',
    network: 'เชื่อมต่อไม่ได้ ลองอีกครั้ง',
  },

  /** The one-time setup, the first time /admin is opened (no account exists yet). */
  setup: {
    title: 'ตั้งค่าบัญชีผู้ดูแลครั้งแรก',
    intro: 'ยังไม่มีบัญชีผู้ดูแล ตั้งชื่อผู้ใช้และรหัสผ่านตอนนี้ แล้วใช้เข้าหน้านี้ทุกครั้ง',
    username: 'ชื่อผู้ใช้',
    usernameHint: 'ตัวอักษรอังกฤษ ตัวเลข . _ - ยาว 3–32 ตัว',
    password: 'รหัสผ่าน',
    passwordHint: 'อย่างน้อย 10 ตัวอักษร ใช้หลายคำต่อกันจำง่ายและเดายาก',
    again: 'พิมพ์รหัสผ่านอีกครั้ง',
    code: 'รหัสตั้งค่า',
    codeHint: 'ดูรหัสได้ในหน้าต่างที่รันเซิร์ฟเวอร์ (หรือในไฟล์ data/admin-setup-code-app.txt) ให้ฝ่ายไอทีช่วยหาให้',
    submit: 'สร้างบัญชีและเข้าสู่ระบบ',
    working: 'กำลังสร้าง…',
    mismatch: 'รหัสผ่านสองช่องไม่ตรงกัน',
    badUsername: 'ชื่อผู้ใช้ไม่ถูกต้อง ใช้ตัวอักษรอังกฤษ ตัวเลข . _ - ยาว 3–32 ตัว',
    weak: 'รหัสผ่านสั้นเกินไป หรือมีชื่อผู้ใช้อยู่ในรหัสผ่าน (ต้องยาวอย่างน้อย 10 ตัวอักษร)',
    badCode: 'รหัสตั้งค่าไม่ถูกต้อง',
    locked: 'ใส่รหัสผิดหลายครั้งเกินไป ลองใหม่อีกครั้งใน 10 นาที',
    already: 'มีบัญชีผู้ดูแลแล้ว ให้เข้าสู่ระบบแทน',
  },

  /** Changing the admin password from inside the panel. */
  account: {
    heading: 'บัญชีผู้ดูแล',
    hint: 'เปลี่ยนรหัสผ่านที่ใช้เข้าหน้านี้ เครื่องอื่นที่ล็อกอินอยู่จะถูกออกจากระบบ',
    username: 'ชื่อผู้ใช้',
    current: 'รหัสผ่านปัจจุบัน',
    next: 'รหัสผ่านใหม่',
    again: 'พิมพ์รหัสผ่านใหม่อีกครั้ง',
    save: 'เปลี่ยนรหัสผ่าน',
    saving: 'กำลังบันทึก…',
    saved: 'เปลี่ยนรหัสผ่านแล้ว',
    mismatch: 'รหัสผ่านใหม่สองช่องไม่ตรงกัน',
    wrongCurrent: 'รหัสผ่านปัจจุบันไม่ถูกต้อง',
    weak: 'รหัสผ่านใหม่สั้นเกินไป หรือมีชื่อผู้ใช้อยู่ (ต้องยาวอย่างน้อย 10 ตัวอักษร)',
    locked: 'ลองผิดหลายครั้งเกินไป ลองใหม่อีกครั้งใน 10 นาที',
    managed: 'บัญชีนี้ตั้งค่าไว้ที่เซิร์ฟเวอร์ (ไฟล์ .env.local) ให้ฝ่ายไอทีเปลี่ยนที่นั่น',
  },

  festivalNone: 'ไม่มีบูธ',

  theme: {
    heading: 'บูธที่เปิดอยู่ตอนนี้',
    hint: 'นักเรียนจะเห็นบูธนี้ตั้งแต่โหลดหน้าถัดไป ข้อมูลที่เก็บไปแล้วไม่เปลี่ยน',
    live: 'เปิดอยู่',
    noContent: 'ยังไม่มีเนื้อหาของบูธนี้ นักเรียนจะเห็นหน้า "ยังไม่มีบูธ"',
    confirm: (name: string) => `เปลี่ยนบูธที่เปิดอยู่เป็น "${name}" ใช่ไหม`,
    saved: 'เปลี่ยนแล้ว',
  },

  summary: {
    total: 'ทั้งหมด',
    completed: 'ทำจนจบ',
    rate: 'อัตราที่ทำจนจบ',
    today: 'วันนี้',
    median: 'เวลาที่ใช้ (กลาง)',
    range: 'ช่วงข้อมูล',
    none: 'ยังไม่มีข้อมูล',
    seconds: 'วินาที',
    minutes: 'นาที',
  },

  events: {
    heading: 'กิจกรรม',
    hint: 'วันที่ เวลา และสถานที่ของแต่ละบูธ แสดงบนหน้าแรก จอบูธ และบัตรโชว์ที่บูธ',
    start: 'วันแรก',
    end: 'วันสุดท้าย',
    time: 'เวลา',
    place: 'สถานที่',
    save: 'บันทึก',
    saving: 'กำลังบันทึก…',
    saved: 'บันทึกแล้ว',
    single: 'วันสุดท้ายก่อนวันแรก จึงนับเป็นวันเดียว',
    failed: 'บันทึกไม่ได้ ลองอีกครั้ง',
  },

  booth: {
    heading: 'บัญชีบูธ',
    hint: 'ใช้เปิดหน้าจอที่บูธ (iPad และทีวี) แยกจากบัญชีผู้ดูแล',
    username: 'ชื่อผู้ใช้',
    saveName: 'บันทึกชื่อ',
    generate: 'สร้างรหัสผ่านใหม่',
    confirmGenerate: 'สร้างรหัสผ่านใหม่ เครื่องที่ล็อกอินอยู่ทุกเครื่องจะถูกออกจากระบบ ทำต่อไหม',
    shownOnce: 'รหัสนี้แสดงครั้งเดียว จดหรือพิมพ์ไว้ตอนนี้ ปิดหน้านี้แล้วดูอีกไม่ได้ (ถ้าลืมให้สร้างใหม่)',
    newPassword: 'รหัสผ่านใหม่',
    isOpen: 'ยังไม่ได้ตั้งรหัสผ่านบูธ ตอนนี้ใครก็เปิดหน้าจอบูธได้',
    isOpenLink: 'ตั้งรหัสผ่านบูธ',
    isSet: 'ตั้งรหัสผ่านแล้ว',
    changedAt: 'เปลี่ยนล่าสุด',
    saved: 'บันทึกแล้ว',
    badName: 'ใช้ตัวอักษรอังกฤษพิมพ์เล็ก ตัวเลข . _ - ยาว 3–24 ตัว',
  },

  charts: {
    perDay: 'จำนวนต่อวัน',
    started: 'เริ่มทำ',
    done: 'ทำจนจบ',
    states: 'ผลเช็กอิน',
    flowers: 'ดอกไม้ที่ได้ที่บูธ',
    answers: 'คำตอบแต่ละข้อ',
    checkin: 'เช็กอิน',
    booth: 'บูธ',
    answered: (n: number) => `ตอบ ${n} คน`,
    empty: 'ยังไม่มีข้อมูลในช่วงนี้',
  },

  filters: {
    heading: 'กรองข้อมูล',
    from: 'ตั้งแต่วันที่',
    to: 'ถึงวันที่',
    mode: 'โหมด',
    status: 'สถานะ',
    festival: 'เทศกาล',
    search: 'รหัสเซสชัน',
    searchHint: 'พิมพ์ตัวอักษรต้นรหัส',
    all: 'ทั้งหมด',
    apply: 'กรอง',
    clear: 'ล้างตัวกรอง',
  },

  modes: { checkin: 'เช็กอิน', booth: 'บูธ' } satisfies Record<Mode, string>,

  status: { done: 'ทำจนจบ', open: 'ยังไม่จบ' },

  states: {
    ok: 'โอเค',
    thinking: 'มีเรื่องให้คิด',
    drained: 'ใช้พลังงานเยอะ',
    heavy: 'น่าจะหนักอยู่',
  } satisfies Record<ResultState, string>,

  sessions: {
    heading: 'รายการที่ผ่านมา',
    groupBy: 'จัดกลุ่มตาม',
    groups: { day: 'วันที่', mode: 'โหมด', state: 'ผลลัพธ์', festival: 'เทศกาล' },
    expandAll: 'เปิดทั้งหมด',
    collapseAll: 'ปิดทั้งหมด',
    unfinished: 'ยังไม่จบ',
    duration: 'ใช้เวลา',
    topics: 'เรื่องหลัก',
    id: 'รหัส',
    copy: 'คัดลอก',
    copied: 'คัดลอกแล้ว',
    delete: 'ลบรายการนี้',
    confirmDelete: 'ลบรายการนี้ถาวร ทำต่อไหม',
    question: 'คำถาม',
    answer: 'คำตอบ',
    noAnswers: 'ยังไม่ได้ตอบข้อไหนเลย',
    none: 'ไม่มีรายการตามตัวกรองนี้',
    shownOf: (shown: number, matched: number) => `แสดง ${shown} จาก ${matched} รายการล่าสุด ส่งออกไฟล์เพื่อดูทั้งหมด`,
    flower: 'ดอกไม้',
    device: 'อุปกรณ์',
  },

  export: {
    heading: 'ส่งออกข้อมูล',
    hint: 'ไฟล์ CSV เปิดใน Excel ได้ ตามตัวกรองที่เลือกอยู่',
    sessions: 'ดาวน์โหลดรายเซสชัน (1 แถวต่อ 1 ครั้ง)',
    answers: 'ดาวน์โหลดรายคำตอบ (1 แถวต่อ 1 คำตอบ)',
  },

  danger: {
    heading: 'ลบข้อมูล',
    hint: 'ควรลบเมื่อสรุปผลให้โรงเรียนเรียบร้อยแล้ว ดาวน์โหลดไฟล์เก็บไว้ก่อน ลบแล้วกู้คืนไม่ได้',
    wipe: 'ลบข้อมูลทั้งหมด',
    typeToConfirm: `พิมพ์ "${WIPE_WORD}" เพื่อยืนยัน`,
    confirmButton: 'ลบทั้งหมดถาวร',
    done: (n: number) => `ลบแล้ว ${n} รายการ`,
    wrongWord: 'คำยืนยันไม่ตรง',
    cancel: 'ยกเลิก',
  },

  errors: {
    generic: 'ไม่สำเร็จ ลองอีกครั้ง',
    unauthorized: 'หมดเวลาเข้าสู่ระบบ กรุณาเข้าใหม่',
  },

  /** The booth devices' own login page. */
  boothLogin: {
    title: 'เข้าสู่ระบบจอบูธ',
    note: 'สำหรับ iPad และทีวีที่บูธเท่านั้น',
    username: 'ชื่อผู้ใช้',
    password: 'รหัสผ่าน',
    submit: 'เข้าสู่ระบบ',
    working: 'กำลังตรวจสอบ…',
    wrong: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง',
    locked: 'ลองผิดหลายครั้งเกินไป รอ 10 นาทีแล้วลองใหม่',
    network: 'เชื่อมต่อไม่ได้ ลองอีกครั้ง',
    notReady: 'จอบูธยังไม่พร้อมใช้งาน ให้ผู้ดูแลตั้งค่าก่อน',
  },
} as const;
