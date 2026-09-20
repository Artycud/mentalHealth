'use client';

import { useRouter } from 'next/navigation';

import { admin } from '@/content/th/admin';

import styles from './admin.module.css';
import { send } from './send';

export function LogoutButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      className={styles.linkButton}
      onClick={async () => {
        await send('/api/admin/logout', 'POST');
        router.replace('/admin/login');
        router.refresh();
      }}
    >
      {admin.signOut}
    </button>
  );
}
