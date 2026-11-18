/** Copy for /greeting: the TV at the event's entrance. It takes turns between two scenes. */
export const greeting = {
  /** The poster: the event itself, as on the council's Loy Krathong poster. */
  poster: {
    by: 'จัดโดย คณะกรรมการสภานักเรียน 2569',
    headline: ['ลอยทุกข์', 'ลอยสุข'],
    sub: 'วันลอยกระทง',
    quote: '“ปล่อยวางสิ่งที่หนักอึ้งในใจให้ลอยออกไป”',
    time: (t: string) => `เวลา ${t}`,
    place: (p: string) => `ณ ${p}`,
  },
  /** What is on: karaoke, ice cream and the booth. */
  title: 'วันนี้ที่นี่มีอะไรบ้าง',
  items: {
    karaoke: { name: 'คาราโอเกะ', line: 'น้องๆนายแน่มาก' },
    icecream: { name: 'ไอศกรีม', line: 'ไอศกรีมกะทิไผ่ทอง' },
    krathong: { name: 'บูธลอยกระทง', line: 'เล่น 5 ข้อ รับดอกไม้ไปแต่งกระทง' },
  },
  /** On the krathong card, only while coupons are still being given (admin's reward switch). */
  sticker: { top: 'คูปองลดไอศกรีม', amount: '10 บาท' },
} as const;
