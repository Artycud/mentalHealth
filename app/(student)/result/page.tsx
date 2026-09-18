import { ResultBattery } from '@/components/illustrations/scenes';
import { PrimaryButton, TextLink } from '@/components/ui/buttons';
import { CudCareBlock } from '@/components/ui/CudCareBlock';
import { SuggestionList, TopicPills } from '@/components/ui/result';
import { Screen } from '@/components/ui/Screen';
import { WordmarkHeader } from '@/components/ui/WordmarkHeader';
import { common } from '@/content/th/common';
import { topicLabels } from '@/content/th/questions';
import { doneNote, referenceResult, stateHeadlines } from '@/content/th/results';

import styles from './result.module.css';

/**
 * PHASE 2: the reference result from BRIEF §8, static. Phase 3 computes the
 * state and topics from the student's answers and picks from the phrase library.
 *
 * Every result keeps a visible route to CUD Care (§12).
 */
export default function ResultPage() {
  const result = referenceResult;

  return (
    <Screen>
      <WordmarkHeader note={doneNote} />

      <div className={styles.scene}>
        <ResultBattery />
      </div>

      <h1 className={styles.headline}>{stateHeadlines[result.state]}</h1>
      <p className={styles.body}>{result.body}</p>

      <TopicPills primary={topicLabels[result.primary]} secondary={topicLabels[result.secondary]} />
      <SuggestionList items={result.suggestions} />
      <CudCareBlock variant="result" />

      <div className={styles.actions}>
        <PrimaryButton href="/">{common.actions.home}</PrimaryButton>
        <TextLink href="/checkin">{common.actions.checkinAgain}</TextLink>
      </div>
    </Screen>
  );
}
