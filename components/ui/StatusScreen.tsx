import { HomeScene } from '@/components/illustrations/scenes';

import { PrimaryButton } from './buttons';
import { Screen } from './Screen';
import styles from './StatusScreen.module.css';
import { WordmarkHeader } from './WordmarkHeader';

/**
 * The plain screen for "page not found", "start again" and "no booth running"
 * (BRIEF §8): ink on paper, one small reused illustration, one button. No red,
 * no warning triangle, no long apology — a student who lands here is not in
 * trouble and the screen should not suggest they are.
 */
export function StatusScreen({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action: { label: string; href: string };
}) {
  return (
    <Screen>
      <WordmarkHeader />
      <div className={styles.scene}>
        <HomeScene />
      </div>
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.body}>{body}</p>
      <div className={styles.action}>
        <PrimaryButton href={action.href}>{action.label}</PrimaryButton>
      </div>
    </Screen>
  );
}
