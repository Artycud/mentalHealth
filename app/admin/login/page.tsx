import { redirect } from 'next/navigation';
import { connection } from 'next/server';

import { Wordmark } from '@/components/illustrations/icons';
import { admin } from '@/content/th/admin';
import { adminConfig, isAdmin } from '@/lib/guard';

import styles from '../admin.module.css';

import { LoginForm } from './LoginForm';

/**
 * The one door into the panel. With no admin account yet, a first visit is sent to the
 * one-time setup instead.
 */
export default async function AdminLoginPage() {
  await connection();
  if (!(await adminConfig())) redirect('/admin/setup');
  if (await isAdmin()) redirect('/admin');

  return (
    <main className={styles.loginWrap}>
      <div className={styles.loginCard}>
        <Wordmark />
        <h1>{admin.login.title}</h1>
        <LoginForm />
      </div>
    </main>
  );
}
