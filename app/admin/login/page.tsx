import { redirect } from 'next/navigation';
import { connection } from 'next/server';

import { Wordmark } from '@/components/illustrations/icons';
import { admin } from '@/content/th/admin';
import { adminConfig, isAdmin } from '@/lib/guard';

import styles from '../admin.module.css';

import { LoginForm } from './LoginForm';

/** The one door into the panel. With the account not set up on the server, it says so. */
export default async function AdminLoginPage() {
  await connection();
  if (await isAdmin()) redirect('/admin');
  const configured = adminConfig() !== null;

  return (
    <main className={styles.loginWrap}>
      <div className={styles.loginCard}>
        <Wordmark />
        <h1>{admin.login.title}</h1>
        {configured ? <LoginForm /> : <p className={styles.note}>{admin.login.notConfigured}</p>}
      </div>
    </main>
  );
}
