/**
 * Home (User Mode) — "ใจวันนี้" direction.
 *
 * The home opens on one thing to DO, not a menu: shape today's heart by dragging
 * it. Left–right is energy (หมดแรง → เต็มแรง), top–bottom is how light or heavy it
 * feels. The word under it follows your finger, and what the page suggests next
 * follows the word. Nothing here is stored.
 *
 * The two axes are the ones a mood meter uses (energy × pleasantness). The words
 * are how a CUD student would say it, not clinical labels.
 */

export type WayId = 'self' | 'vent' | 'checkin';

/**
 * Row 0 = light, 1 = in between, 2 = heavy. Column 0 = low energy … 2 = high.
 *
 * `message` is what the check-up's result says to that heart: one or two warm,
 * light lines, never advice or a diagnosis. DRAFTS awaiting council review.
 *
 * `fact` is one true, interesting thing that fits that heart, with where it comes
 * from, so a teen leaves knowing something new rather than being told what to do.
 * Keep each one to what the study actually found; do not stretch it.
 *
 * Later these can be chosen per situation (the topics picked, the time of day) or
 * written by the AI; the shape here is what the page needs either way.
 */
export interface Fact {
  text: string;
  source: string;
}

export const feelings: { word: string; line: string; message: string; fact: Fact }[][] = [
  [
    { word: 'สบาย ๆ', line: 'ใจนิ่ง ๆ ไม่ต้องรีบไปไหน', message: 'ใจนิ่ง ๆ แบบนี้ดีแล้ว วันนี้ไม่ต้องรีบเป็นอะไรให้ใครก็ได้นะ', fact: { text: 'แค่ได้อยู่ข้างนอกกับต้นไม้ใบหญ้าราว 20 นาที ฮอร์โมนความเครียดในร่างกายก็ลดลงได้แล้ว ไม่ต้องทำอะไรเลยก็ได้', source: 'Hunter et al., Frontiers in Psychology, 2019' } },
    { word: 'โอเคดี', line: 'วันนี้ไปได้เรื่อย ๆ', message: 'วันธรรมดาที่ไปได้เรื่อย ๆ ก็เป็นวันที่ดีแล้ว ขอบคุณตัวเองที่พามาถึงตรงนี้', fact: { text: 'คนที่จดเรื่องดี ๆ 3 เรื่องก่อนนอนทุกคืนเป็นเวลาหนึ่งสัปดาห์ รู้สึกดีขึ้นต่อเนื่องไปได้นานหลายเดือน', source: 'Seligman et al., American Psychologist, 2005' } },
    { word: 'ใจฟู', line: 'มีแรง มีอะไรอยากทำ', message: 'แรงเยอะแบบนี้ ลองเอาไปทำอะไรที่ชอบสักอย่าง หรือแบ่งให้เพื่อนที่ดูเหนื่อย ๆ บ้างก็ได้', fact: { text: 'ความสุขติดต่อกันได้จริง งานวิจัยที่ติดตามคนหลายพันคนพบว่า เมื่อเพื่อนที่อยู่ใกล้ ๆ มีความสุข โอกาสที่เราจะมีความสุขตามก็สูงขึ้นด้วย', source: 'Fowler & Christakis, BMJ, 2008' } },
  ],
  [
    { word: 'เนือย ๆ', line: 'ไม่ได้แย่ แค่ไม่ค่อยมีแรง', message: 'ไม่มีแรงก็ไม่เป็นไร วันนี้ทำแค่ที่จำเป็นก็พอ ที่เหลือค่อยว่ากันพรุ่งนี้', fact: { text: 'เดินเล่นแค่ 10 นาทีก็ช่วยให้อารมณ์ดีขึ้นได้แล้ว ไม่ต้องออกกำลังหนักหรือนาน', source: 'Edwards & Loprinzi, Complementary Therapies in Medicine, 2018' } },
    { word: 'เฉย ๆ', line: 'ไม่ขึ้น ไม่ลง', message: 'วันเฉย ๆ ก็มีได้ ลองหาอะไรเล็ก ๆ ให้ยิ้มสักอย่าง เพลงโปรดสักเพลงก็ยังดี', fact: { text: 'ตอนฟังท่อนที่ชอบที่สุดในเพลงโปรด สมองหลั่งโดพามีน สารเดียวกับที่หลั่งตอนได้รางวัล', source: 'Salimpoor et al., Nature Neuroscience, 2011' } },
    { word: 'ฟุ้ง ๆ', line: 'คิดหลายเรื่องพร้อมกัน', message: 'หัวคิดหลายเรื่องพร้อมกันเหนื่อยนะ ลองเอาออกมาจากหัวสักเรื่อง จะเขียนหรือเล่าก็ได้', fact: { text: 'สมองทำงานได้ทีละเรื่อง ที่เรียกว่าทำหลายอย่างพร้อมกัน จริง ๆ คือการสลับไปมา ซึ่งกินเวลาและพลังมากกว่าทำทีละอย่าง', source: 'Rubinstein, Meyer & Evans, Journal of Experimental Psychology, 2001' } },
  ],
  [
    { word: 'เหนื่อยใจ', line: 'แบตใกล้หมด อยากพักจริง ๆ', message: 'เหนื่อยขนาดนี้ พักได้เลยนะ ไม่ต้องรู้สึกผิดที่ยังไม่ไหว', fact: { text: 'วัยรุ่นต้องการนอนคืนละ 8–10 ชั่วโมง มากกว่าผู้ใหญ่ ถ้านอนน้อยกว่านี้ อารมณ์ก็แกว่งง่ายขึ้นด้วย', source: 'American Academy of Sleep Medicine, 2016' } },
    { word: 'หนัก ๆ', line: 'มีอะไรค้างอยู่ในใจ', message: 'สิ่งที่ค้างอยู่ในใจ ไม่ต้องถือไว้คนเดียวก็ได้ ลองเล่าออกมาสักนิดไหม', fact: { text: 'แค่เรียกชื่อความรู้สึกออกมา เช่น "ตอนนี้เศร้า" สมองส่วนที่ตื่นตัวกับอารมณ์ (อะมิกดาลา) ก็ทำงานเบาลงได้แล้ว', source: 'Lieberman et al., Psychological Science, 2007' } },
    { word: 'เครียด', line: 'ใจเต้นเร็ว อยู่ไม่สุข', message: 'ใจเต้นเร็วแบบนี้ ลองหายใจช้า ๆ สักรอบ แล้วค่อยเล่าออกมาทีละนิดก็ได้', fact: { text: 'หายใจเข้าสั้น ๆ สองครั้งติดกัน แล้วผ่อนออกยาว ๆ ทางปาก ทำแบบนี้วันละ 5 นาที ช่วยให้ใจเย็นลงได้ดีกว่านั่งสมาธิเฉย ๆ', source: 'Balban et al., Cell Reports Medicine, 2023' } },
  ],
];

/** What the page suggests first, per row, and why — pointing at what they chose. */
export const forRow: { order: WayId[]; reason: string }[] = [
  { order: ['self', 'vent', 'checkin'], reason: 'ใจว่างพอดี ลองมารู้จักตัวเองอีกนิดไหม' },
  { order: ['checkin', 'vent', 'self'], reason: 'ลองเช็กดูไหม ว่าช่วงนี้มันมาจากเรื่องไหน' },
  { order: ['vent', 'checkin', 'self'], reason: 'มีอะไรค้างอยู่ ลองพิมพ์ออกมาก่อนก็ได้นะ' },
];

export const heart = {
  headline: 'ใจวันนี้ หน้าตาเป็นแบบไหน?',
  hint: 'แตะที่ใจ แล้วลากไปทางที่ใช่',
  axes: { light: 'เบา ๆ', heavy: 'หนัก ๆ', low: 'หมดแรง', high: 'เต็มแรง' },
  confirm: 'ประมาณนี้แหละ',
  skip: 'ข้ามไปก่อน',

  forYou: {
    noteBefore: 'มีอะไรให้ทำที่นี่',
    notePrefix: 'สำหรับใจที่',
    fallback: 'เลือกสิ่งที่อยากทำตอนนี้ได้เลย',
    pick: 'แนะนำตอนนี้',
  },

  ways: {
    self: {
      title: 'รู้จักตัวเองอีกนิด',
      body: 'ตอบไม่กี่ข้อ แล้วดูว่าเป็นคนแบบไหน แบบอ่านแล้ว "เออ ใช่"',
      meta: 'ประมาณ 2 นาที',
      samples: ['เติมพลังด้วยการอยู่คนเดียว', 'หรืออยู่กับเพื่อน?'],
    },
    vent: {
      title: 'ระบายอะไรสักอย่าง',
      body: 'พิมพ์สิ่งที่ค้างในใจออกมา แล้วสิ่งที่ตอบกลับจะมาจากที่เขียนจริง ๆ',
      meta: 'ไม่ต้องใส่ชื่อ',
      /** Typed out, one at a time, on the note. Invented, generic, never a real student's. */
      samples: [
        'พรุ่งนี้สอบ แต่ยังอ่านไม่จบเลย…',
        'ไม่รู้จะเล่าให้ใครฟังดี…',
        'ช่วงนี้เหนื่อยแบบบอกไม่ถูก…',
      ],
    },
    checkin: {
      title: 'เช็กว่าช่วงนี้ใจเป็นไง',
      body: '8 คำถามสั้น ๆ เรื่องเรียน การนอน เพื่อน ที่บ้าน',
      meta: 'ประมาณ 2 นาที',
    },
  } satisfies Record<WayId, { title: string; body: string; meta: string; samples?: string[] }>,

  care: {
    title: 'บางเรื่อง คุยกับคนจริง ๆ ดีกว่า',
    body: 'CUD Care พร้อมรับฟัง ไม่ต้องรอให้เรื่องใหญ่ก่อน',
    link: 'ดูช่องทางติดต่อ CUD Care',
  },

  booth: {
    title: 'บูธที่โถงโรงอาหาร',
    now: 'รอบนี้',
    play: 'ไปเล่นที่บูธ',
  },
} as const;

/** Bangkok hour → a small handwritten greeting. */
export function greetingFor(hour: number): string {
  if (hour >= 5 && hour < 11) return 'อรุณสวัสดิ์';
  if (hour >= 11 && hour < 13) return 'พักเที่ยงแล้ว';
  if (hour >= 13 && hour < 17) return 'บ่ายแล้วนะ';
  if (hour >= 17 && hour < 21) return 'เย็นนี้';
  return 'ดึกแล้วนะ';
}

/** The pages MBTI and VENT land on until they are built. */
export const soon = {
  self: {
    title: 'รู้จักตัวเองอีกนิด',
    body: 'กำลังทำอยู่ เร็ว ๆ นี้จะเป็นคำถามไม่กี่ข้อ แล้วได้ผลว่าเป็นคนแบบไหน',
    note: 'ไม่ใช่แบบทดสอบทางจิตวิทยานะ ไว้สำรวจตัวเองเฉย ๆ',
  },
  vent: {
    title: 'ระบายอะไรสักอย่าง',
    body: 'กำลังทำอยู่ ที่นี่จะเป็นที่ให้พิมพ์สิ่งที่อยู่ในใจออกมา แล้วได้คำตอบกลับมาจากสิ่งที่เขียนจริง ๆ',
    note: 'ไม่ต้องใส่ชื่อ',
  },
  back: 'กลับหน้าแรก',
} as const;
