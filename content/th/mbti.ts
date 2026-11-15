/**
 * "รู้จักตัวเองอีกนิด": a short look at which of MBTI's four sides a student leans
 * to (components/mbti/Mbti, scored by lib/mbti.ts).
 *
 * How it is built, so it stays quick and still means something:
 *  - 12 questions, 3 for each side: where energy comes from (E/I), how things are
 *    taken in (S/N), how decisions are made (T/F), how life is arranged (J/P).
 *    An odd number per side means there is never a tie.
 *  - Each question is two everyday school moments to choose between, not a scale
 *    to rate yourself on: quicker, and less "what should I say".
 *  - The sides take turns, and which side is offered first alternates, so a
 *    student who always taps the top answer does not get a made-up type.
 *  - The result says how clear each side was (3 of 3, or 2 of 3), never more than
 *    the answers show.
 *
 * It is a light self-exploration inspired by MBTI, not the official instrument,
 * and the page says so. Nothing is stored.
 *
 * Voice (BRIEF §10): a friend, not an app. DRAFT awaiting council review.
 */

export type Axis = 'EI' | 'SN' | 'TF' | 'JP';
export type Pole = 'E' | 'I' | 'S' | 'N' | 'T' | 'F' | 'J' | 'P';

export interface MbtiQuestion {
  axis: Axis;
  ask: string;
  /** The two answers, in the order they are shown. */
  options: readonly [{ text: string; pole: Pole }, { text: string; pole: Pole }];
}

export const mbtiQuestions: readonly MbtiQuestion[] = [
  {
    axis: 'EI',
    ask: 'สอบวันสุดท้ายเพิ่งจบ เธออยาก…',
    options: [
      { text: 'นัดเพื่อนไปฉลองต่อเลย', pole: 'E' },
      { text: 'กลับบ้านไปพักเงียบ ๆ คนเดียวก่อน', pole: 'I' },
    ],
  },
  {
    axis: 'SN',
    ask: 'ครูเริ่มสอนเรื่องใหม่ แบบไหนเข้าหัวกว่า',
    options: [
      { text: 'ภาพรวมก่อน ว่ามันเชื่อมกับอะไร', pole: 'N' },
      { text: 'ตัวอย่างจริง ทีละขั้นชัด ๆ', pole: 'S' },
    ],
  },
  {
    axis: 'TF',
    ask: 'เพื่อนขอให้ดูงานที่ยังไม่ค่อยดี เธอจะ…',
    options: [
      { text: 'บอกตรง ๆ ว่าต้องแก้ตรงไหน', pole: 'T' },
      { text: 'ชมส่วนที่ดีก่อน แล้วค่อย ๆ บอก', pole: 'F' },
    ],
  },
  {
    axis: 'JP',
    ask: 'อีกสองอาทิตย์สอบ ตอนนี้เธอ…',
    options: [
      { text: 'อ่านตอนรู้สึกพร้อม หรือช่วงใกล้ ๆ', pole: 'P' },
      { text: 'มีตารางอ่านแล้ว ว่าวันไหนอ่านอะไร', pole: 'J' },
    ],
  },
  {
    axis: 'EI',
    ask: 'ทำงานกลุ่มกับคนที่เพิ่งรู้จัก เธอมัก…',
    options: [
      { text: 'ฟังก่อน แล้วค่อยพูดตอนพร้อม', pole: 'I' },
      { text: 'เปิดบทสนทนา ชวนทุกคนคุยก่อน', pole: 'E' },
    ],
  },
  {
    axis: 'SN',
    ask: 'เล่าเรื่องสนุกเมื่อวานให้เพื่อนฟัง เธอเล่าแบบ…',
    options: [
      { text: 'ละเอียดทีละช็อต ตามที่เกิดขึ้นจริง', pole: 'S' },
      { text: 'เล่าว่ามันรู้สึกยังไง ข้ามรายละเอียดไปบ้าง', pole: 'N' },
    ],
  },
  {
    axis: 'TF',
    ask: 'ต้องเลือกเรื่องสำคัญ เธอดูอะไรมากกว่า',
    options: [
      { text: 'ใจตัวเอง และคนที่จะได้รับผล', pole: 'F' },
      { text: 'เหตุผล ข้อดีข้อเสียที่ชั่งได้', pole: 'T' },
    ],
  },
  {
    axis: 'JP',
    ask: 'ไปเที่ยวกับเพื่อน แบบไหนสบายใจกว่า',
    options: [
      { text: 'มีแผนว่าไปไหน กี่โมง', pole: 'J' },
      { text: 'ไปถึงแล้วค่อยดูว่าอยากทำอะไร', pole: 'P' },
    ],
  },
  {
    axis: 'EI',
    ask: 'มีเรื่องต้องคิดให้ออก เธอคิดได้ดีตอน…',
    options: [
      { text: 'ได้พูดออกมา คุยกับใครสักคน', pole: 'E' },
      { text: 'ได้อยู่เงียบ ๆ กับความคิดตัวเอง', pole: 'I' },
    ],
  },
  {
    axis: 'SN',
    ask: 'ว่างทั้งวัน เธออยาก…',
    options: [
      { text: 'นั่งคิด จินตนาการ เล่นกับไอเดียใหม่ ๆ', pole: 'N' },
      { text: 'ลงมือทำอะไรที่จับต้องได้ เช่น ทำอาหาร จัดห้อง', pole: 'S' },
    ],
  },
  {
    axis: 'TF',
    ask: 'เพื่อนสองคนทะเลาะกัน สิ่งแรกที่เธออยาก…',
    options: [
      { text: 'รู้ว่าเกิดอะไรขึ้น ใครพูดอะไร', pole: 'T' },
      { text: 'ให้ทั้งคู่ใจเย็นลง กลับมาดีกันก่อน', pole: 'F' },
    ],
  },
  {
    axis: 'JP',
    ask: 'โต๊ะหรือไฟล์ในเครื่องของเธอ…',
    options: [
      { text: 'กระจาย ๆ หน่อย แต่รู้ว่าอะไรอยู่ไหน', pole: 'P' },
      { text: 'มีที่ทางของมัน หาเจอเร็ว', pole: 'J' },
    ],
  },
];

/** Each side, and what each end of it means, said plainly. */
export const axes: Record<Axis, { name: string; poles: Record<string, string> }> = {
  EI: { name: 'พลังมาจากไหน', poles: { E: 'การได้อยู่กับคน', I: 'เวลาอยู่กับตัวเอง' } },
  SN: { name: 'รับรู้เรื่องราวแบบไหน', poles: { S: 'สิ่งที่จับต้องได้', N: 'มองภาพรวม' } },
  TF: { name: 'ตัดสินใจด้วยอะไร', poles: { T: 'เหตุผล', F: 'ใจและคนรอบตัว' } },
  JP: { name: 'ใช้ชีวิตแบบไหน', poles: { J: 'วางแผนให้ชัด', P: 'ยืดหยุ่นตามจังหวะ' } },
};

export interface MbtiType {
  /** A friendly name, our own words (not any other site's). */
  name: string;
  /** Who this is, in one line. */
  line: string;
  /** What they bring. */
  strength: string;
  /** On a tired day: something small that tends to help a heart like this. */
  care: string;
}

export const mbtiTypes: Record<string, MbtiType> = {
  INTJ: {
    name: 'นักวางแผนเงียบ ๆ',
    line: 'มองไกล คิดเป็นระบบ ชอบเข้าใจว่าทุกอย่างทำงานยังไง',
    strength: 'เห็นทางไปถึงเป้าหมาย ก่อนคนอื่นจะเห็น',
    care: 'วันที่เหนื่อย ลองยอมให้แผนไม่สมบูรณ์บ้าง ไม่ต้องคิดแทนทุกคนก็ได้',
  },
  INTP: {
    name: 'นักสงสัย',
    line: 'ชอบตั้งคำถาม ชอบไอเดีย ชอบเข้าใจให้ถึงแก่น',
    strength: 'มองเห็นมุมที่คนอื่นมองข้าม',
    care: 'วันที่หัวไม่หยุดคิด ลองเขียนความคิดลงกระดาษ แล้วพักสายตาสักพัก',
  },
  ENTJ: {
    name: 'ผู้นำทีม',
    line: 'ตัดสินใจไว ชอบพาทีมไปให้ถึง',
    strength: 'ทำให้เรื่องยาก ๆ เดินหน้าได้จริง',
    care: 'วันที่เหนื่อย ลองแบ่งงานให้คนอื่นถือบ้าง ไม่ต้องแบกทั้งทีมคนเดียว',
  },
  ENTP: {
    name: 'นักไอเดีย',
    line: 'ไอเดียเยอะ ชอบลองของใหม่ ชอบถกกันสนุก ๆ',
    strength: 'เปลี่ยนปัญหาให้เป็นทางเลือกใหม่ ๆ',
    care: 'วันที่ทำหลายอย่างพร้อมกัน ลองเลือกแค่เรื่องเดียวให้จบก่อน',
  },
  INFJ: {
    name: 'ผู้ฟังลึก ๆ',
    line: 'เข้าใจคนได้ลึก มีความหมายบางอย่างที่อยากทำให้เกิด',
    strength: 'ทำให้คนรอบตัวรู้สึกว่ามีคนเข้าใจ',
    care: 'วันที่รับเรื่องของคนอื่นมาเยอะ ลองถามใจตัวเองบ้างว่าตอนนี้เป็นยังไง',
  },
  INFP: {
    name: 'นักฝันใจดี',
    line: 'มีโลกข้างในที่ละเอียดอ่อน ยึดสิ่งที่ตัวเองเชื่อ',
    strength: 'ใจดีอย่างจริงใจ และมองเห็นความงามในเรื่องเล็ก ๆ',
    care: 'วันที่ใจหนัก ลองเขียนหรือวาดมันออกมา ไม่ต้องสวยก็ได้',
  },
  ENFJ: {
    name: 'คนรวมใจ',
    line: 'อบอุ่น ชอบช่วยให้คนรอบตัวเติบโต',
    strength: 'ทำให้กลุ่มรู้สึกเป็นทีมเดียวกัน',
    care: 'วันที่เหนื่อย ลองปฏิเสธบางเรื่องดู ใจดีกับตัวเองก็นับนะ',
  },
  ENFP: {
    name: 'คนจุดประกาย',
    line: 'สดใส อยากรู้อยากลอง มองเห็นความเป็นไปได้ในทุกคน',
    strength: 'ทำให้คนรอบตัวกล้าฝัน',
    care: 'วันที่พลังหมด ลองพักจากหน้าจอ แล้วทำอะไรช้า ๆ สักอย่าง',
  },
  ISTJ: {
    name: 'คนที่ไว้ใจได้',
    line: 'รับผิดชอบ ละเอียด พูดแล้วทำจริง',
    strength: 'เป็นหลักให้คนอื่นพึ่งได้',
    care: 'วันที่อะไรไม่เป็นไปตามแผน ลองบอกตัวเองว่าแบบนี้ก็ยังโอเค',
  },
  ISFJ: {
    name: 'ผู้ดูแล',
    line: 'ใส่ใจรายละเอียดของคนรอบตัว ชอบช่วยแบบเงียบ ๆ',
    strength: 'จำได้ว่าใครชอบอะไร และดูแลคนอื่นได้ดี',
    care: 'วันที่เหนื่อย ลองขอความช่วยเหลือดู คนที่ดูแลคนอื่นก็ต้องการคนดูแล',
  },
  ESTJ: {
    name: 'คนจัดการ',
    line: 'ชัดเจน เป็นระเบียบ ชอบให้งานเสร็จตามที่ตกลงกัน',
    strength: 'ทำให้ทุกอย่างเป็นรูปเป็นร่างและทันเวลา',
    care: 'วันที่หงุดหงิด ลองพักสักห้านาที แล้วค่อยกลับมาคุยกันใหม่',
  },
  ESFJ: {
    name: 'คนอบอุ่นของกลุ่ม',
    line: 'เข้าคนง่าย ชอบให้ทุกคนรู้สึกดีและมีส่วนร่วม',
    strength: 'ทำให้ทุกคนในกลุ่มรู้สึกว่ามีที่ยืน',
    care: 'วันที่กังวลว่าใครจะคิดยังไง ลองถามตัวเองก่อนว่าเราอยากได้อะไร',
  },
  ISTP: {
    name: 'นักลงมือ',
    line: 'ใจเย็น ชอบเข้าใจของด้วยการลองทำจริง',
    strength: 'แก้ปัญหาเฉพาะหน้าได้เก่ง',
    care: 'วันที่เครียด ลองขยับตัว เดินเล่น หรือทำอะไรด้วยมือสักอย่าง',
  },
  ISFP: {
    name: 'ศิลปินเงียบ ๆ',
    line: 'อ่อนโยน ใช้ชีวิตตามจังหวะของตัวเอง',
    strength: 'สัมผัสความรู้สึกและความงามได้ละเอียด',
    care: 'วันที่ใจไม่นิ่ง ลองฟังเพลงที่ชอบ หรืออยู่ในที่ที่สบายตา',
  },
  ESTP: {
    name: 'นักลุย',
    line: 'กล้าลอง ตัดสินใจไว อยู่กับปัจจุบันได้ดี',
    strength: 'พาทุกคนออกไปลงมือทำ',
    care: 'วันที่ทำอะไรเร็วไป ลองหยุดหายใจลึก ๆ สามครั้งก่อนตัดสินใจ',
  },
  ESFP: {
    name: 'คนสีสัน',
    line: 'สนุก มีพลัง ชอบทำให้ช่วงเวลาธรรมดาพิเศษขึ้น',
    strength: 'ทำให้คนรอบตัวยิ้มได้',
    care: 'วันที่เศร้า ไม่ต้องสดใสตลอดก็ได้ บอกเพื่อนสนิทสักคนว่าวันนี้ไม่ไหว',
  },
};

export const mbti = {
  intro: {
    note: 'รู้จักตัวเองอีกนิด',
    title: 'เธอเป็นคนแบบไหน?',
    body: '12 คำถามสั้น ๆ แต่ละข้อมีสองทาง เลือกอันที่ใกล้ตัวเธอมากกว่า ไม่มีคำตอบผิด ไม่ถึง 2 นาที',
    go: 'เริ่มเลย',
  },
  /** Above each question. */
  count: (n: number, of: number) => `ข้อ ${n} จาก ${of}`,
  /** Under the first question only. */
  hint: 'ไม่ต้องคิดนาน อันแรกที่รู้สึกว่าใช่ คือใช่',
  result: {
    note: 'เธอน่าจะเป็น',
    strengthNote: 'สิ่งที่เธอมี',
    careNote: 'วันที่เหนื่อย',
    sidesTitle: 'แต่ละด้านของเธอ',
    /** Under each side: how clear the answers were, naming the letter. */
    clear: (letter: string) => `ชัดเจนว่าเป็น ${letter}`,
    lean: (letter: string) => `มีทั้งสองแบบ ค่อนไปทาง ${letter} นิดนึง`,
    honest:
      'ผลนี้ไว้สำรวจตัวเองเฉย ๆ ได้แรงบันดาลใจจาก MBTI แต่ไม่ใช่แบบทดสอบทางการ คนเราเปลี่ยนไปตามช่วงชีวิตได้ ด้านไหนที่ได้ 2 จาก 3 แปลว่าเธอมีทั้งสองแบบอยู่ในตัว',
    next: 'แล้วใจวันนี้ล่ะ',
    checkup: 'เช็กใจตอนนี้',
    again: 'ทำใหม่อีกรอบ',
    home: 'กลับหน้าแรก',
  },
} as const;
