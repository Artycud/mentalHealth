
import { UserPage } from '@/components/heart/UserPage';
import { Checkup } from '@/components/checkup/Checkup';
import { placeholders } from '@/content/th/common';

// The status bar takes the sky's colour: components/heart/SkyClock.

/**
 * The guided "ใจวันนี้" check-up. Nothing is stored. `?start=1` means the student
 * has already said yes (the home's heart): it opens on question 1.
 */
export default async function CheckupPage({ searchParams }: { searchParams: Promise<{ start?: string }> }) {
  const { start } = await searchParams;
  return (
    <UserPage town={false}>
      <Checkup careHref={placeholders.cudCareHref} start={start === '1' ? 'energy' : 'meet'} />
    </UserPage>
  );
}
