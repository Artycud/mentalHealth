import { ProgressRow } from '@/components/ui/ProgressRow';
import { Screen } from '@/components/ui/Screen';
import { questionNote, questions, referenceQuestionIndex } from '@/content/th/questions';

import { AnswerList } from './AnswerList';
import styles from './checkin.module.css';

/**
 * PHASE 2: the reference screen — question 3 of 8, with the second answer
 * pre-selected so the selected state can be compared against the reference.
 * Phase 3 replaces this with the real flow, which starts with nothing selected.
 *
 * There is deliberately no bottom button. Auto-advance is the chosen behaviour
 * (BRIEF §9), so a button appears only on the last question, as มาดูผลกัน.
 * The reference screen shows ไปต่อ because it predates that decision.
 */
export default function CheckinPage() {
  const question = questions[referenceQuestionIndex];

  return (
    <Screen top={16}>
      <ProgressRow current={referenceQuestionIndex + 1} total={questions.length} backHref="/" />

      <p className={styles.note}>{questionNote}</p>
      <h1 className={styles.headline}>{question.headline}</h1>

      <AnswerList choices={question.choices} initialSelected="b" />
    </Screen>
  );
}
