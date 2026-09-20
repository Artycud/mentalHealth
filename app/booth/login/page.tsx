import { redirect } from 'next/navigation';
import { connection } from 'next/server';

import { Wordmark } from '@/components/illustrations/icons';
import { admin } from '@/content/th/admin';
import { getBoothAccount } from '@/lib/auth';
import { isBooth } from '@/lib/guard';

import { BoothLoginForm } from './BoothLoginForm';
import styles from './login.module.css';

/**
 * Where the kiosk and the TV sign in (BRIEF §11): a booth-only account, separate from
 * the admin's. Until the admin has made a password there is nothing to sign in to, so
 * it just passes through to the screen.
 */
const ALLOWED = ['/booth/kiosk', '/booth/display'];

export default async function BoothLoginPage(props: PageProps<'/booth/login'>) {
  await connection();
  const { next } = await props.searchParams;
  const asked = Array.isArray(next) ? next[0] : next;
  // Only ever back to one of the two booth screens, never an address someone chose.
  const target = asked && ALLOWED.includes(asked) ? asked : '/booth/kiosk';

  const account = await getBoothAccount();
  if (!account.hash || (await isBooth())) redirect(target);

  return (
    <main className={styles.stage}>
      <div className={styles.card}>
        <Wordmark />
        <h1 className={styles.title}>{admin.boothLogin.title}</h1>
        <p className={styles.note}>{admin.boothLogin.note}</p>
        <BoothLoginForm next={target} />
      </div>
    </main>
  );
}
