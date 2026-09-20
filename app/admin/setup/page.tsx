import { redirect } from 'next/navigation';
import { connection } from 'next/server';

import { Wordmark } from '@/components/illustrations/icons';
import { admin } from '@/content/th/admin';
import { getSetupCode } from '@/lib/auth';
import { adminConfig, setupNeedsCode } from '@/lib/guard';

import styles from '../admin.module.css';

import { SetupForm } from './SetupForm';

/**
 * The one-time setup (BRIEF §11): shown only while there is no admin account, and gone
 * the moment there is one. On a live server it also asks for the setup code, which is
 * made here the first time the page is opened and printed in the server's log.
 */
export default async function AdminSetupPage() {
  await connection();
  if (await adminConfig()) redirect('/admin/login');
  const needsCode = setupNeedsCode();
  if (needsCode) await getSetupCode(); // makes it, and prints it in the server's log

  return (
    <main className={styles.loginWrap}>
      <div className={styles.loginCard}>
        <Wordmark />
        <h1>{admin.setup.title}</h1>
        <p className={styles.hint}>{admin.setup.intro}</p>
        <SetupForm needsCode={needsCode} />
      </div>
    </main>
  );
}
