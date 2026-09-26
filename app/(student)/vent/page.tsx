import type { Viewport } from 'next';

import { Vent } from '@/components/vent/Vent';
import { placeholders } from '@/content/th/common';

export const viewport: Viewport = { themeColor: '#FFF8FA', colorScheme: 'light' };

/**
 * ระบาย. `?feel=row-col` is where the check-up left the student's heart, so the
 * conversation can start from it; anything else is ignored.
 */
export default async function VentPage({ searchParams }: { searchParams: Promise<{ feel?: string }> }) {
  const { feel } = await searchParams;
  return (
    <main data-home="heart">
      <Vent feel={feel && /^[0-2]-[0-2]$/.test(feel) ? feel : undefined} careHref={placeholders.cudCareHref} />
    </main>
  );
}
