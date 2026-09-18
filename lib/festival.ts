import type { ActiveFestival } from './types';

/**
 * Which festival booth is live.
 *
 * PHASE 2 STUB: always Loy Krathong, the default in BRIEF §3. Phase 4 reads
 * `setting.active_festival` on every student page load, through lib/db.ts so
 * the storage choice (still undecided — see BRIEF.md) stays behind one seam.
 */
export function getActiveFestival(): ActiveFestival {
  return 'loykrathong';
}
