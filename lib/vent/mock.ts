/**
 * A stand-in for the AI, for development and tests only. It never runs in
 * production (lib/vent/provider.ts), and the page labels its answers as a test,
 * because a template must never pass for something that listened.
 *
 * It does the two things the page needs to be designed against: it picks a
 * phrase from the student's own words, and it answers in the contract's shape.
 */

import type { Feeling, VentProvider } from './types.ts';

const TOPICS: { words: string[]; feeling: Feeling; lines: string[] }[] = [
  {
    words: ['สอบ', 'การบ้าน', 'งาน', 'เรียน', 'เกรด', 'ครู', 'ติว'],
    feeling: 'tense',
    lines: ['เรื่องเรียนที่มากองพร้อมกันแบบนี้ เหนื่อยทั้งหัวทั้งใจเลยนะ', 'ไม่แปลกเลยที่จะรู้สึกแบบนี้', 'ตอนนี้อันไหนค้างอยู่ในใจที่สุด เล่าต่อได้นะ'],
  },
  {
    words: ['เพื่อน', 'กลุ่ม', 'โดนเท', 'ทะเลาะ'],
    feeling: 'heavy',
    lines: ['เรื่องกับเพื่อนมันกวนใจได้นานจริง ๆ', 'เพราะเป็นคนที่เราอยู่ด้วยทุกวัน', 'เกิดอะไรขึ้นบ้าง เล่าให้ฟังอีกหน่อยได้ไหม'],
  },
  {
    words: ['บ้าน', 'แม่', 'พ่อ', 'พี่', 'น้อง', 'ครอบครัว'],
    feeling: 'heavy',
    lines: ['เรื่องที่บ้านเป็นเรื่องที่หนีไม่ค่อยได้ เลยหนักแบบเงียบ ๆ', 'ขอบคุณที่เล่าออกมานะ', 'ตอนนี้อยู่ตรงไหนของเรื่องนี้อยู่'],
  },
  {
    words: ['แฟน', 'ชอบ', 'อกหัก', 'เลิก', 'คนคุย'],
    feeling: 'mixed',
    lines: ['เรื่องหัวใจนี่ทำให้วุ่นได้ทั้งวันเลย', 'ความรู้สึกแบบนี้ไม่ต้องรีบหายก็ได้', 'อยากเล่าต่อไหมว่าเป็นยังไงบ้าง'],
  },
  {
    words: ['เหนื่อย', 'ง่วง', 'นอน', 'หมดแรง', 'ไม่ไหว'],
    feeling: 'tired',
    lines: ['เหนื่อยสะสมแบบนี้ ร่างกายกับใจกำลังขอพักอยู่', 'วันนี้ไม่ต้องเก่งทุกอย่างก็ได้นะ', 'มีอะไรที่ทำให้เหนื่อยที่สุดช่วงนี้ไหม'],
  },
];

const FALLBACK = {
  feeling: 'mixed' as Feeling,
  lines: ['ขอบคุณที่เล่าให้ฟังนะ', 'ฟังดูเป็นเรื่องที่อยู่ในใจมาสักพักแล้ว', 'อยากเล่าต่อจากตรงไหนก็ได้เลย'],
};

/** A short run of the student's own words: the longest space-separated piece, trimmed. */
export function pickHeard(text: string): string {
  const pieces = text
    .split(/[\s,.!?…]+/)
    .map((p) => p.trim())
    .filter((p) => p.length >= 3);
  const best = pieces.sort((a, b) => b.length - a.length)[0] ?? text.trim();
  return best.length > 40 ? best.slice(0, 40) : best;
}

export const mockProvider: VentProvider = {
  mock: true,
  async respond(input) {
    const last = [...input.messages].reverse().find((m) => m.role === 'user')?.text ?? '';
    const topic = TOPICS.find((t) => t.words.some((w) => last.includes(w))) ?? FALLBACK;
    return {
      heard: pickHeard(last),
      reply: topic.lines,
      feeling: topic.feeling,
      risk: 'none',
    };
  },
};
