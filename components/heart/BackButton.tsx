import Link from 'next/link';

import { BackChevron } from '@/components/illustrations/icons';
import { common } from '@/content/th/common';
import { BACK } from '@/lib/nav';

import styles from './BackButton.module.css';

/**
 * The one "back" in User Mode: the same chevron in the same 44px target as the
 * check-in's progress row (components/ui/ProgressRow), so the check-up, the
 * check-in and VENT all step back the same way. A link when back means leaving
 * (it slides the page back to the left), a button when it means the previous step.
 */
export function BackButton({ href, onBack }: { href?: string; onBack?: () => void }) {
  if (onBack) {
    return (
      <button type="button" aria-label={common.actions.back} className={styles.back} onClick={onBack} data-press>
        <BackChevron />
      </button>
    );
  }
  return (
    <Link href={href ?? '/'} aria-label={common.actions.back} className={styles.back} transitionTypes={BACK} data-press>
      <BackChevron />
    </Link>
  );
}
