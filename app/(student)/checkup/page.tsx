import type { Viewport } from 'next';

import { UserPage } from '@/components/heart/UserPage';
import { Checkup } from '@/components/checkup/Checkup';
import { placeholders } from '@/content/th/common';

export const viewport: Viewport = { themeColor: '#FFF8FA', colorScheme: 'light' };

/**
 * The guided "ใจวันนี้" check-up. Nothing is stored. `?start=1` means the student
 * has already said yes (the home's heart): it opens on question 1.
 */
export default async function CheckupPage({ searchParams }: { searchParams: Promise<{ start?: string }> }) {
  const { start } = await searchParams;
  return (
    <UserPage>
      <Checkup careHref={placeholders.cudCareHref} start={start === '1' ? 'energy' : 'meet'} />
    </UserPage>
  );
}
