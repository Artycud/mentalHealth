import type { Viewport } from 'next';

import { Checkup } from '@/components/checkup/Checkup';
import { placeholders } from '@/content/th/common';

export const viewport: Viewport = { themeColor: '#FFF8FA', colorScheme: 'light' };

/** The guided "ใจวันนี้" check-up. Nothing is stored. */
export default function CheckupPage() {
  return (
    <main data-home="heart">
      <Checkup careHref={placeholders.cudCareHref} />
    </main>
  );
}
