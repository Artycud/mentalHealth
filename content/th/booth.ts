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
 */

import type { FestivalId } from '@/lib/types';

export interface FestivalTheme {
  id: FestivalId;
  name: string;
  /** Replaces --sunflower. The only colour a theme may swap. */
  accent: string;
  /** Empty means "no content yet" — the booth route shows the closed state. */
  ready: boolean;
}

export const festivals: Record<FestivalId, FestivalTheme> = {
  loykrathong: {
    id: 'loykrathong',
    name: 'ลอยกระทง',
    accent: '#FFB511',
    ready: false, // flips to true in phase 2 once copy + illustration land
  },
  christmas: {
    id: 'christmas',
    name: 'คริสต์มาส',
    accent: '#FFB511', // TODO: awaiting council content
    ready: false,
  },
  'cny-valentine': {
    id: 'cny-valentine',
    name: 'ตรุษจีน & วาเลนไทน์',
    accent: '#FFB511', // TODO: awaiting council content
    ready: false,
  },
};

/** Order of the "บูธถัดไป" pills on the home screen (§8). */
export const upcomingOrder: FestivalId[] = ['loykrathong', 'christmas', 'cny-valentine'];

// TODO(phase 2): Loy Krathong quiz (3 questions), the four flower results, and
// the ticket copy. ดาวเรือง is written in §8; the other three flowers are
// placeholders for the council, since the booth can only hand out what it
// actually has.
