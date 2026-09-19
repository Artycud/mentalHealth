/**
 * Shared Thai copy.
 *
 * All Thai strings live in content/ — never hardcoded inside a component
 * (BRIEF §0). Keeping the shape flat and typed means an English file can be
 * added later without touching a single component.
 *
 * Voice (§10): the way a CUD student talks to a friend. Short, plain,
 * conversational. Not a wellness app, not corporate.
 */

/**
 * Facts from the approved project document (โครงการ CUD Mental Health Week).
 * Booth dates now live per-festival in booth.ts; these are the shared ones.
 */
export const eventFacts = {
  /** Same slot for all three booths. */
  boothTime: '11.10–12.50 น.',
  /** โถงโรงอาหาร — the canteen hall. */
  boothPlace: 'โถงโรงอาหาร',
} as const;

/** Still awaiting the council. Never invent these (§15). */
export const placeholders = {
  /** CUD Care contact channels. Anchor until then. */
  cudCareHref: '#cud-care',
} as const;

export const common = {
  wordmark: 'CUD Mental Health Week',
  footer: 'โปรเจกต์ของสภานักเรียน CUD',

  /** Shown on every result. Never says "ไม่เก็บคำตอบ" — answers ARE stored (§12). */
  privacyNote:
    'ไม่ต้องใส่ชื่อ คำตอบจะถูกเก็บแบบไม่ระบุตัวตน เพื่อสรุปภาพรวมของกิจกรรม',

  actions: {
    home: 'กลับหน้าแรก',
    startCheckin: 'เช็กอินความรู้สึก',
    checkinAgain: 'เช็กอินอีกครั้ง',
    /** The soft nudge under the booth result's button (§8). */
    tryCheckin: 'ลองเช็กอินความรู้สึกด้วยไหม?',
    seeResult: 'มาดูผลกัน',
    playBooth: 'เล่นเลย',
    back: 'ย้อนกลับ',
  },

  loading: 'กำลังโหลด…',
} as const;

/** CUD Care never disappears — every result keeps a visible route to it (§12). */
export const cudCare = {
  home: {
    title: 'อยากคุยกับใครสักคน?',
    body: 'CUD Care พร้อมรับฟังนะ',
    link: 'ดูช่องทางติดต่อ',
  },
  result: {
    body: 'ถ้าอยากคุยกับใครสักคน CUD Care ก็พร้อมช่วยนะ',
    link: 'ดูช่องทางติดต่อ CUD Care',
  },
} as const;

export const home = {
  headline: 'วันนี้ใจเป็นยังไงบ้าง?',
  body: 'แวะมาเช็กอินกับตัวเองสักนิด ใช้เวลาแป๊บเดียว',
  /** Festival section — the Itim note sits above the H2 (§7). */
  festivalNote: 'ตอนนี้ที่โรงอาหาร',
  nextBoothLabel: 'บูธถัดไป',
} as const;

/** Plain and short. No red alarm colours, warning triangles or apologies (§8). */
export const errors = {
  notFound: {
    title: 'หน้านี้ไม่มีแล้ว',
    body: 'กลับไปหน้าแรกแล้วเริ่มใหม่ได้เลย',
    action: common.actions.home,
  },
  checkinInterrupted: {
    title: 'เริ่มใหม่อีกรอบนะ',
    body: 'คำตอบเมื่อกี้ไม่ได้เก็บไว้',
    action: 'เริ่มเช็กอิน',
  },
  noBooth: {
    title: 'หน้านี้จะเปิดตอนมีบูธ',
    body: `แล้วเจอกันที่${eventFacts.boothPlace}`,
    action: common.actions.home,
  },
} as const;
