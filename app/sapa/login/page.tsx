import { redirect } from 'next/navigation';
import { connection } from 'next/server';

import { Wordmark } from '@/components/illustrations/icons';
import { sapa } from '@/content/th/sapa';
import { isSapa } from '@/lib/guard';

import styles from '../../booth/login/login.module.css';
import { SapaLoginForm } from './SapaLoginForm';

/** Where the พี่สภา team signs in to answer ระบาย: one shared password, set by the admin. */
export default async function SapaLoginPage() {
  await connection();
  if (await isSapa()) redirect('/sapa');
  return (
    <main className={styles.stage}>
      <div className={styles.card}>
        <Wordmark />
        <h1 className={styles.title}>{sapa.login.title}</h1>
        <p className={styles.note}>{sapa.login.note}</p>
        <SapaLoginForm />
      </div>
    </main>
  );
}
