import Link from 'next/link';

import { soon } from '@/content/th/heart';

import { HeartTheme } from './HeartTheme';
import styles from './Soon.module.css';

/** Where รู้จักตัวเอง and ระบาย land until they are built: same sky, honest words. */
export function Soon({ id }: { id: 'self' | 'vent' }) {
  const copy = soon[id];
  return (
    <HeartTheme>
      <main className={styles.root} data-id={id}>
        <div className={styles.art} aria-hidden="true">
          <span />
          <span />
        </div>
        <h1 className={styles.title}>{copy.title}</h1>
        <p className={styles.body}>{copy.body}</p>
        <p className={styles.note}>{copy.note}</p>
        <Link href="/" className={styles.back}>
          {soon.back}
        </Link>
      </main>
    </HeartTheme>
  );
}
