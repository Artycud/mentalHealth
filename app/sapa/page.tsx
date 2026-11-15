import { connection } from 'next/server';

import { requireSapaPage } from '@/lib/guard';

import { SapaInbox } from './SapaInbox';

export const metadata = { title: 'กล่องระบาย · พี่สภา', robots: { index: false, follow: false } };

/**
 * The พี่สภา inbox: every open ระบาย conversation, and the box to answer in. For
 * the team (shared password) or an admin. `?t=<ref>` opens one conversation, which
 * is where a Discord ping's "เปิดในเว็บ" lands.
 */
export default async function SapaPage(props: { searchParams: Promise<{ t?: string | string[] }> }) {
  await connection();
  await requireSapaPage();
  const { t } = await props.searchParams;
  return <SapaInbox initial={typeof t === 'string' ? t : null} />;
}
