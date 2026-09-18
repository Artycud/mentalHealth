/**
 * Festival themes for booth mode.
 *
 * Only one festival is active at a time and the admin panel chooses it (§8).
 * A theme changes ONLY four things: the accent colour that replaces sunflower,
 * the small home festival icon, the booth illustration, and the booth copy and
 * result set. Paper, ink, pink, blue, typography, components, spacing and
 * motion are identical across every festival. A theme must never introduce a
 * new font, a gradient, or snow or heart animations.
 *
 * Loy Krathong is the one that matters now — it is the upcoming booth and must
 * be complete and polished. The other two are structure only.
 *
 * Icon and illustration components are not stored on the record: they are
 * looked up by festival id where they are rendered, which keeps this file plain
 * data that an English translation can copy without touching components.
 */

import type { FestivalId } from '@/lib/types';

import { placeholders } from './common';

export interface FestivalTheme {
  id: FestivalId;
  name: string;
  /** Replaces --sunflower. The only colour a theme may swap. */
  accent: string;
  /** False until the festival has content. An unready festival shows the
   *  "no booth running" state and only the next-booth pills on the home screen. */
  ready: boolean;
  /** Home-screen festival section. Present only once `ready`. */
  home?: {
    blurb: string;
  };
  /** Booth result screen. Present only once `ready`. */
  ticket?: {
    label: string;
    resultNote: string;
    title: string;
    body: string;
    where: string;
  };
}

export const festivals: Record<FestivalId, FestivalTheme> = {
  loykrathong: {
    id: 'loykrathong',
    name: 'ลอยกระทง',
    accent: '#FFB511',
    ready: true,
    home: {
      blurb: 'ตอบคำถามสั้น ๆ แล้วเอาผลไปรับดอกไม้มาแต่งกระทงที่บูธ',
    },
    ticket: {
      label: 'บูธลอยกระทง',
      resultNote: 'ดอกไม้ของคุณคือ',
      title: 'เอาหน้านี้ไปโชว์ที่บูธ',
      body: 'รับดอกดาวเรืองไปแต่งกระทงของคุณได้เลย',
      where: `ที่โรงอาหาร ${placeholders.boothDate}`,
    },
  },
  christmas: {
    id: 'christmas',
    name: 'คริสต์มาส',
    accent: '#FFB511', // TODO: awaiting council content — placeholder accent
    ready: false,
  },
  'cny-valentine': {
    id: 'cny-valentine',
    name: 'ตรุษจีน & วาเลนไทน์',
    accent: '#FFB511', // TODO: awaiting council content — placeholder accent
    ready: false,
  },
};

/** Order of the festivals, which also fixes the order of the next-booth pills. */
export const festivalOrder: FestivalId[] = ['loykrathong', 'christmas', 'cny-valentine'];

/**
 * Loy Krathong flower results.
 *
 * ดาวเรือง is written in BRIEF §8. The other three are placeholders for the
 * council: the booth can only hand out what it actually has, so we do not
 * invent flowers. Phase 3 maps the three quiz answers onto these four.
 */
export const loykrathongFlowers = {
  marigold: {
    name: 'ดาวเรือง',
    body: 'สีสด ทนแดด อยู่ได้นาน เหมือนคำตอบเมื่อกี้ของคุณเลย',
  },
  // TODO: awaiting council content — the three other flowers the booth stocks.
} as const;

// TODO(phase 3): the 3-question Loy Krathong quiz and its answer → flower map.
