import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { admin } from '@/content/th/admin';

import styles from './admin.module.css';

/** Never indexed, never previewed: the panel is for the council only. */
export const metadata: Metadata = {
  title: `${admin.title} · CUD Mental Health Week`,
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <div className={styles.root}>{children}</div>;
}
