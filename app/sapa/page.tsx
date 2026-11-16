import { cookies } from 'next/headers';
import { connection } from 'next/server';

import { requireSapaPage } from '@/lib/guard';
import { SAPA_NAME_COOKIE } from '@/lib/vent/name';
import { cleanName } from '@/lib/vent/threads';

import { SapaInbox } from './SapaInbox';

export const metadata = { title: 'กล่องระบาย · พี่สภา', robots: { index: false, follow: false } };

/**
 * The พี่สภา inbox: every open ระบาย conversation, and the box to answer in. For
 * the team (shared password) or an admin. `?t=<ref>` opens one conversation, which
 * is where a Discord ping's "เปิดในเว็บ" lands. The device's nickname comes from its
 * cookie, so a named พี่ never sees the name prompt, not even for a frame.
 */
export default async function SapaPage(props: { searchParams: Promise<{ t?: string | string[] }> }) {
  await connection();
  await requireSapaPage();
  const { t } = await props.searchParams;
  const name = cleanName((await cookies()).get(SAPA_NAME_COOKIE)?.value) ?? '';
  return <SapaInbox initial={typeof t === 'string' ? t : null} name={name} />;
}
