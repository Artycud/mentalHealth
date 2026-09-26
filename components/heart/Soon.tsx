import Link from 'next/link';

import { soon } from '@/content/th/heart';

import styles from './Soon.module.css';

/** Where รู้จักตัวเอง and ระบาย land until they are built: same sky, honest words. */
export function Soon({ id }: { id: 'self' | 'vent' }) {
  const copy = soon[id];
  return (
    <main data-home="heart" className={styles.root} data-id={id}>
      <div className={styles.sky} aria-hidden="true" />
      <div className={styles.orb} aria-hidden="true" />
      <h1 className={styles.title}>{copy.title}</h1>
      <p className={styles.body}>{copy.body}</p>
      <p className={styles.note}>{copy.note}</p>
      <Link href="/" className={styles.back}>
        {soon.back}
      </Link>
    </main>
  );
}
