'use client';

import { useState } from 'react';

import { AnswerCard } from '@/components/ui/AnswerCard';
import type { Choice } from '@/lib/types';

import styles from './checkin.module.css';

/**
 * PHASE 2: selection is local state only, so the cards can be pressed and the
 * selected state reviewed. Phase 3 lifts this into the question flow and adds
 * auto-advance 250ms after a tap (BRIEF §9).
 */
export function AnswerList({
  choices,
  initialSelected = null,
}: {
  choices: readonly Choice[];
  initialSelected?: string | null;
}) {
  const [selected, setSelected] = useState<string | null>(initialSelected);

  return (
    <div className={styles.answers}>
      {choices.map((choice) => (
        <AnswerCard
          key={choice.id}
          label={choice.label}
          icon={choice.icon}
          selected={selected === choice.id}
          onSelect={() => setSelected(choice.id)}
        />
      ))}
    </div>
  );
}
