'use client';

import { useMemo, useSyncExternalStore, type CSSProperties } from 'react';

import { HeartTheme } from '@/components/heart/HeartTheme';
import { StillHeart } from '@/components/heart/StillHeart';
import { PrimaryButton, TextLink } from '@/components/ui/buttons';
import { CudCareBlock } from '@/components/ui/CudCareBlock';
import { SuggestionList, TopicPills } from '@/components/ui/result';
import { Screen } from '@/components/ui/Screen';
import { StatusScreen } from '@/components/ui/StatusScreen';
import { WordmarkHeader } from '@/components/ui/WordmarkHeader';
import { common, errors } from '@/content/th/common';
import { buildResult, doneNote } from '@/content/th/results';
import { parseAnswers, readRawAnswers } from '@/lib/checkin-store';
import { scoreCheckin } from '@/lib/scoring';
import type { ResultState } from '@/lib/types';

import styles from './result.module.css';

/** There is nothing to subscribe to: the answers are written once, before we get here. */
const subscribe = () => () => {};

/**
 * Where each result sits on the check-up's heart (energy, weight), so the heart
 * here speaks the same colours: light and mint when it is okay, heavier and
 * violet as it gets harder.
 */
const HEART: Record<ResultState, { energy: number; weight: number }> = {
  ok: { energy: 0.45, weight: 0.12 },
  thinking: { energy: 0.5, weight: 0.45 },
  drained: { energy: 0.12, weight: 0.72 },
  heavy: { energy: 0.3, weight: 0.92 },
};

/** The place in the reveal order (§9), read by `.rise` in the stylesheet. */
const order = (i: number) => ({ '--i': i }) as CSSProperties;

/**
 * The check-in result, worked out on the phone from the answers the question
 * screens left in session storage. The server recomputes the same thing from the
 * stored answers and keeps its own value (BRIEF §3), so the phone can never
 * post a result of its own.
 *
 * Every result carries a visible route to CUD Care (§12): the site never
 * diagnoses anyone and never tells a student they are fine.
 */
export function ResultView() {
  // `undefined` while the page is being hydrated (the server cannot see session
  // storage), then the stored text or null. Reading it this way avoids a flash of
  // the wrong screen and needs no effect to copy it into state.
  const raw = useSyncExternalStore(subscribe, readRawAnswers, () => undefined);

  const scored = useMemo(() => {
    if (raw === undefined) return undefined;
    const answers = parseAnswers(raw);
    return answers ? scoreCheckin(answers) : null;
  }, [raw]);

  // Hydrating: the header only, so nothing jumps when the result arrives.
  if (scored === undefined) {
    return (
      <HeartTheme>
        <Screen>
          <WordmarkHeader />
        </Screen>
      </HeartTheme>
    );
  }

  // Refreshed with nothing stored, or opened directly: say so plainly (§8).
  if (scored === null) {
    return (
      <HeartTheme>
        <StatusScreen
          title={errors.checkinInterrupted.title}
          body={errors.checkinInterrupted.body}
          action={{ label: errors.checkinInterrupted.action, href: '/checkin' }}
        />
      </HeartTheme>
    );
  }

  const result = buildResult(scored);

  return (
    <HeartTheme>
    <Screen>
      <WordmarkHeader note={doneNote} />

      <div className={styles.scene}>
        <StillHeart {...HEART[scored.state]} size={190} className={styles.heart} />
      </div>

      <h1 className={`${styles.headline} ${styles.rise}`} style={order(1)}>
        {result.headline}
      </h1>
      <p className={`${styles.body} ${styles.rise}`} style={order(2)}>
        {result.body}
      </p>

      <div className={styles.rise} style={order(3)}>
        <TopicPills primary={result.primaryLabel} secondary={result.secondaryLabel} />
      </div>
      <div className={styles.rise} style={order(4)}>
        <SuggestionList items={result.suggestions} />
      </div>

      <CudCareBlock variant="result" />

      <div className={styles.actions}>
        <PrimaryButton href="/">{common.actions.home}</PrimaryButton>
        <TextLink href="/checkin">{common.actions.checkinAgain}</TextLink>
      </div>
    </Screen>
    </HeartTheme>
  );
}
