/**
 * Home (User Mode) — the event's front door.
 *
 * Asks nothing of the student. It says what CUD Mental Health Week is, when the
 * next round is, that every round has live music and food, what each round is
 * about, and — quietly, for whenever they want it — what they can do on this
 * site. CUD Care is always there.
 *
 * Facts only from the project document and the council: dates live in
 * lib/events.ts, the wellbeing themes and booth activities per round are the
 * project document's. Band names, menus and prices are not known: never invent.
 */

import type { FestivalId } from '@/lib/types';

export const landing = {
  hero: {
    kicker: 'CUD Mental Health Week',
    title: 'ให้ใจได้พักบ้าง',
    body: 'ช่วงพักเที่ยง 3 รอบ ตลอดเทอมนี้ ที่โถงโรงอาหาร มีดนตรีสด มีของกิน แล้วก็มีกิจกรรมเล็ก ๆ ให้ใจได้หายใจ',
    scroll: 'เลื่อนลงดูว่ามีอะไรบ้าง',
    /** The one thing to do on arrival: a light look at today's heart, never a test. */
    check: {
      ask: 'อยากรู้ไหม',
      title: 'ใจตอนนี้เป็นยังไง?',
      tap: 'แตะที่ใจ',
      sub: 'ตอบแค่ 2 เรื่อง ไม่มีถูกผิด',
    },
  },

  every: {
    note: 'ทุกรอบมี',
    items: [
      { id: 'music', title: 'ดนตรีสด', body: 'มานั่งฟังเพลงเพลิน ๆ ระหว่างกินข้าว' },
      { id: 'food', title: 'ของกิน', body: 'มีของกินรออยู่ แวะมากินด้วยกัน ไม่ต้องรีบ' },
      { id: 'booth', title: 'กิจกรรมที่บูธ', body: 'ทำอะไรเล็ก ๆ ด้วยมือ ให้หัวได้พักจากเรื่องเรียน' },
    ],
  },

  rounds: {
    note: '3 รอบ 3 เรื่องของใจ',
    title: 'แต่ละรอบ คุยกันเรื่องอะไร',
    now: 'วันนี้',
    next: 'รอบถัดไป',
    inDays: (n: number) => (n === 1 ? 'พรุ่งนี้แล้ว' : `อีก ${n} วัน`),
    past: 'ผ่านไปแล้ว',
  },

  /** The two panels under the check-up. */
  more: {
    mbti: {
      note: 'อยากรู้ไหม',
      title: 'MBTI ของเธอคืออะไร?',
      foot: 'ตอบไม่กี่ข้อ แบบอ่านแล้ว "เออ ใช่"',
    },
    vent: {
      note: 'มีอะไรค้างอยู่ในใจไหม',
      title: 'ระบายให้ AI ฟัง',
      foot: 'ตอบจากที่เขียนจริง ๆ · ไม่เก็บข้อความ',
    },
  },

  care: {
    title: 'บางเรื่อง คุยกับคนจริง ๆ ดีกว่า',
    body: 'CUD Care พร้อมรับฟัง ไม่ต้องรอให้เรื่องใหญ่ก่อน',
    link: 'ดูช่องทางติดต่อ CUD Care',
  },

  footer: {
    where: 'โถงโรงอาหาร · พักเที่ยง',
    council: 'โปรเจกต์ของสภานักเรียน CUD',
  },
} as const;

/**
 * Per round: only what it is about, said plainly (from the project document; the
 * full wording is in content/th/booth.ts). What students will DO at each booth is
 * deliberately left out: the council keeps it a surprise until the day.
 */
export const roundDetail: Record<FestivalId, { theme: string }> = {
  loykrathong: { theme: 'ปล่อยวางเรื่องที่หนักใจ และรับมือกับความรู้สึกแย่ ๆ' },
  christmas: { theme: 'สร้างความหวัง และรับมือเวลาผิดหวัง' },
  'cny-valentine': { theme: 'ความรัก และทุกรูปแบบของความสัมพันธ์' },
};
