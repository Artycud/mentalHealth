import Link from 'next/link';

import { SpeechBubble } from '@/components/illustrations/icons';
import { cudCare, placeholders } from '@/content/th/common';

import { PillLink } from './buttons';
import styles from './CudCareBlock.module.css';

/**
 * A visible route to CUD Care. Every result keeps one (BRIEF §12) — the site
 * never diagnoses and never tells a student they are fine.
 */
export function CudCareBlock({ variant }: { variant: 'home' | 'result' }) {
  if (variant === 'home') {
    return (
      <section className={`${styles.block} ${styles.home}`}>
        <SpeechBubble />
        <div className={styles.text}>
          <h2 className={styles.title}>{cudCare.home.title}</h2>
          <p className={styles.body}>{cudCare.home.body}</p>
          <Link href={placeholders.cudCareHref} className={styles.homeLink}>
            {cudCare.home.link}
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section id="cud-care" className={`${styles.block} ${styles.result}`}>
      <p className={styles.resultBody}>{cudCare.result.body}</p>
      <div className={styles.resultLink}>
        <PillLink href={placeholders.cudCareHref} body>
          {cudCare.result.link}
        </PillLink>
      </div>
    </section>
  );
}
