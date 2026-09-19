import { ChoiceMark } from '@/components/booth/ChoiceMark';
import { AnswerIcon, CheckBadge } from '@/components/illustrations/icons';
import type { AnswerIcon as AnswerIconVariant, ChoiceMark as MarkVariant } from '@/lib/types';

import styles from './AnswerCard.module.css';

interface AnswerCardProps {
  label: string;
  /** The check-in's moon phases. Exactly one of `icon` and `mark` is given. */
  icon?: AnswerIconVariant;
  /** The booth quiz's neutral shapes. */
  mark?: MarkVariant;
  selected: boolean;
  onSelect: () => void;
}

/** A real <button> with aria-pressed, 68px minimum, 44px+ target (BRIEF §7, §13). */
export function AnswerCard({ label, icon, mark, selected, onSelect }: AnswerCardProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={`${styles.card} ${selected ? styles.selected : ''}`}
    >
      {mark ? <ChoiceMark mark={mark} size={32} /> : icon ? <AnswerIcon variant={icon} /> : null}
      <span className={styles.label}>{label}</span>
      <span className={styles.slot} aria-hidden="true">
        <span className={styles.badge}>
          <CheckBadge />
        </span>
      </span>
    </button>
  );
}
