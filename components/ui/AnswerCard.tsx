import { AnswerIcon, CheckBadge } from '@/components/illustrations/icons';
import type { AnswerIcon as AnswerIconVariant } from '@/lib/types';

import styles from './AnswerCard.module.css';

interface AnswerCardProps {
  label: string;
  icon: AnswerIconVariant;
  selected: boolean;
  onSelect: () => void;
}

/** A real <button> with aria-pressed, 68px minimum, 44px+ target (BRIEF §7, §13). */
export function AnswerCard({ label, icon, selected, onSelect }: AnswerCardProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={`${styles.card} ${selected ? styles.selected : ''}`}
    >
      <AnswerIcon variant={icon} />
      <span className={styles.label}>{label}</span>
      <span className={styles.slot} aria-hidden="true">
        <span className={styles.badge}>
          <CheckBadge />
        </span>
      </span>
    </button>
  );
}
