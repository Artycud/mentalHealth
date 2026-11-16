/**
 * Telling the พี่สภา team a student has written, in their Discord channel.
 *
 * Every student message pings, with one short summary of the whole queue (how
 * many wait, how many are urgent, the longest and the average wait). A burst is
 * merged: within a minute of a ping, it is edited to count the new messages
 * instead of a new ping being posted. sweepQueue (student polling, and
 * app/api/cron/sapa-queue) tags the people in DISCORD_OVERDUE_USER_IDS (never
 * @everyone), at most every 30 minutes, while anyone has waited 30 minutes or more.
 *
 * Two ways to set it up (environment variables on the server; see docs/sapa.md):
 *   DISCORD_WEBHOOK_URL                       a ping with a link to the inbox
 *   DISCORD_BOT_TOKEN + DISCORD_CHANNEL_ID    a ping with an "อ่านและตอบ" button,
 *     + DISCORD_PUBLIC_KEY                    so a พี่ can read and answer inside
 *                                             Discord (app/api/discord/route.ts)
 * DISCORD_ROLE_ID (optional) mentions that role, so its members get a push.
 *
 * PRIVACY: a ping never carries what the student wrote, only that someone wrote.
 * Their words appear in Discord only privately, to the one พี่ who taps "อ่านและตอบ".
 * A failed ping never stops the student's message being saved: it is logged by
 * name only and the inbox still shows it.
 */

import { getMarks, queueStats, setMarks, waitText, type QueueStats } from './queue.ts';

const API = 'https://discord.com/api/v10';

export type DiscordMode = 'bot' | 'webhook' | null;

/** A setting as pasted into Vercel can carry spaces, a line break or quotes: drop them. */
const setting = (value: string | undefined) => (value ?? '').trim().replace(/^["']|["']$/g, '').trim();

export function discordMode(env = process.env): DiscordMode {
  if (setting(env.DISCORD_BOT_TOKEN) && setting(env.DISCORD_CHANNEL_ID) && setting(env.DISCORD_PUBLIC_KEY)) return 'bot';
  if (setting(env.DISCORD_WEBHOOK_URL)) return 'webhook';
  return null;
}

const webhookUrl = () => setting(process.env.DISCORD_WEBHOOK_URL);
const channelId = () => setting(process.env.DISCORD_CHANNEL_ID);
const roleId = () => setting(process.env.DISCORD_ROLE_ID);
/** Who is tagged when someone has waited 30 minutes: Discord user IDs, comma separated. */
const overdueUsers = () =>
  setting(process.env.DISCORD_OVERDUE_USER_IDS)
    .split(/[\s,]+/)
    .filter((id) => /^\d{5,25}$/.test(id));

async function call(url: string, init: RequestInit): Promise<Response | null> {
  try {
    const res = await fetch(url, { ...init, signal: AbortSignal.timeout(4000) });
    if (!res.ok) console.error('discord: refused', res.status);
    return res;
  } catch (error) {
    console.error('discord: failed', error instanceof Error ? error.name : 'unknown');
    return null;
  }
}

const botHeaders = () => ({ Authorization: `Bot ${setting(process.env.DISCORD_BOT_TOKEN)}`, 'Content-Type': 'application/json' });

const mention = () => (roleId() ? `<@&${roleId()}> ` : '');

/** The second line of every ping: the queue at a glance. */
function summary(q: QueueStats): string {
  const urgent = q.urgent ? ` (ด่วน ${q.urgent})` : '';
  return `รอตอบ ${q.waiting} แชท${urgent} · รอนานสุด ${waitText(q.oldestMin)} · เฉลี่ย ${waitText(q.avgMin)}`;
}

function buttons(origin: string, ref: string | null, urgent: boolean) {
  const inbox = `${origin}/sapa`;
  return [
    {
      type: 1,
      components: ref
        ? [
            { type: 2, style: urgent ? 4 : 1, label: 'อ่านและตอบ', custom_id: `read:${ref}` },
            { type: 2, style: 5, label: 'เปิดในเว็บ', url: `${inbox}?t=${ref}` },
          ]
        : [{ type: 2, style: 5, label: 'เปิดกล่องข้อความ', url: inbox }],
    },
  ];
}

/**
 * Posts a ping, or (with `edit`) rewrites an earlier one in place. A ping for one
 * chat links to it (with its "อ่านและตอบ" button in bot mode); otherwise to the
 * inbox. Returns the Discord message id, so the ping can be edited or marked later.
 */
async function send(
  content: string,
  o: { origin: string; ref: string | null; urgent?: boolean; users?: string[]; edit?: string },
): Promise<string | null> {
  const mode = discordMode();
  const link = o.ref ? `${o.origin}/sapa?t=${o.ref}` : `${o.origin}/sapa`;
  // Only the role and the named people can ever be notified: never @everyone or @here.
  const allowed_mentions = { roles: roleId() ? [roleId()] : [], users: o.users ?? [], parse: [] as string[] };
  let res: Response | null = null;
  if (mode === 'bot') {
    const base = `${API}/channels/${channelId()}/messages`;
    res = await call(o.edit ? `${base}/${o.edit}` : base, {
      method: o.edit ? 'PATCH' : 'POST',
      headers: botHeaders(),
      body: JSON.stringify({ content, allowed_mentions, components: buttons(o.origin, o.ref, !!o.urgent) }),
    });
  } else if (mode === 'webhook') {
    const url = webhookUrl();
    res = await call(o.edit ? `${url}/messages/${o.edit}` : `${url}${url.includes('?') ? '&' : '?'}wait=true`, {
      method: o.edit ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: `${content}\n${link}`, allowed_mentions }),
    });
  }
  if (!res?.ok) return null;
  try {
    return String(((await res.json()) as { id: string }).id);
  } catch {
    return o.edit ?? null;
  }
}

/** Messages within this long of a ping are merged into it (the ping is edited, not repeated). */
const MERGE_MS = 60_000;

/**
 * A student wrote. Every message pings, with the queue's summary; but a burst is
 * merged: within a minute of the last ping, that ping is edited to count the new
 * messages instead of a new one being posted. Urgent always posts a fresh ping.
 * Returns the ping's id for a fresh ping for this chat (so it can be marked when
 * the chat ends). Never throws.
 */
export async function notifySapa(p: { ref: string; urgent: boolean; isNew: boolean; origin: string }): Promise<string | null> {
  if (!discordMode()) return null;
  try {
    const now = Date.now();
    const [q, m] = await Promise.all([queueStats(now), getMarks()]);
    if (!p.urgent && m.pingId && now - m.pingAt < MERGE_MS) {
      const n = m.pingCount + 1;
      const ref = m.pingRef === p.ref ? p.ref : null;
      const head = ref ? `💬 น้องพิมพ์มา ${n} ข้อความ` : `💬 ข้อความใหม่ ${n} ข้อความ`;
      const edited = await send(`${mention()}${head}\n${summary(q)}`, { origin: p.origin, ref, edit: m.pingId });
      if (edited) await setMarks({ pingCount: n, pingRef: ref ?? '' });
      return null;
    }
    const head = p.urgent
      ? '🚨 **ด่วน** มีข้อความที่อาจต้องการความช่วยเหลือ'
      : p.isNew
        ? '💬 มีน้องเพิ่งทักมา'
        : '💬 น้องพิมพ์เพิ่ม';
    const id = await send(`${mention()}${head}\n${summary(q)}`, { origin: p.origin, ref: p.ref, urgent: p.urgent });
    // An urgent ping stays as it is: the next message starts its own.
    await setMarks({ pingAt: now, pingId: p.urgent ? '' : (id ?? ''), pingCount: 1, pingRef: p.ref });
    return id;
  } catch (error) {
    console.error('discord: notify failed', error instanceof Error ? error.name : 'unknown');
    return null;
  }
}

let lastSweep = 0;
const OVERDUE_MS = 30 * 60_000;

/**
 * The 30-minute check: while anyone has waited 30 minutes or more, tags the people
 * in DISCORD_OVERDUE_USER_IDS (or the role, if none are set) with the queue (again at most every 30 minutes). Cheap to call often: on its own
 * it runs at most once a minute per server instance.
 */
export async function sweepQueue(origin: string, force = false): Promise<'off' | 'idle' | 'overdue'> {
  if (!discordMode()) return 'off';
  const now = Date.now();
  if (!force && now - lastSweep < 60_000) return 'idle';
  lastSweep = now;
  try {
    const [q, m] = await Promise.all([queueStats(now), getMarks()]);
    if (q.waiting === 0 || q.oldestMin < 30 || now - m.overdueAt < OVERDUE_MS) return 'idle';
    const users = overdueUsers();
    const tags = users.length ? `${users.map((id) => `<@${id}>`).join(' ')} ` : mention();
    await send(`${tags}⏰ **มีน้องรอเกิน 30 นาทีแล้ว** ช่วยกันตอบหน่อยนะ\n${summary(q)}`, { origin, ref: null, users });
    await setMarks({ overdueAt: now, pingId: '' });
    return 'overdue';
  } catch (error) {
    console.error('discord: sweep failed', error instanceof Error ? error.name : 'unknown');
    return 'idle';
  }
}

/** The student ended the chat: say so on its ping and take the buttons away. */
export async function markEnded(discordId: string | null): Promise<void> {
  if (!discordId || discordMode() !== 'bot') return;
  await call(`${API}/channels/${channelId()}/messages/${discordId}`, {
    method: 'PATCH',
    headers: botHeaders(),
    body: JSON.stringify({ content: '✔️ แชทนี้จบแล้ว ข้อความถูกลบหมดแล้ว', components: [] }),
  });
}

export type DiscordTest =
  | { ok: true; mode: Exclude<DiscordMode, null> }
  | { ok: false; reason: 'not_set' | 'bad_url' | 'not_found' | 'refused' | 'unreachable'; status?: number };

/**
 * For the admin panel's "ทดสอบแจ้งเตือน Discord": sends one test ping and says
 * exactly what happened, so a setup mistake shows on screen, not only in the logs.
 */
export async function testDiscord(origin: string): Promise<DiscordTest> {
  const mode = discordMode();
  if (!mode) return { ok: false, reason: 'not_set' };
  const content = `🔔 ทดสอบการแจ้งเตือนจากเว็บ ถ้าเห็นข้อความนี้ แปลว่าพร้อมแล้ว
${origin}/sapa`;
  let url: string;
  let init: RequestInit;
  if (mode === 'webhook') {
    url = webhookUrl();
    if (!/^https:\/\/(discord|discordapp)\.com\/api\/webhooks\/\d+\/[\w-]+/.test(url)) return { ok: false, reason: 'bad_url' };
    init = { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content, allowed_mentions: { parse: [] } }) };
  } else {
    url = `${API}/channels/${channelId()}/messages`;
    init = { method: 'POST', headers: botHeaders(), body: JSON.stringify({ content, allowed_mentions: { parse: [] } }) };
  }
  try {
    const res = await fetch(url, { ...init, signal: AbortSignal.timeout(6000) });
    if (res.ok) return { ok: true, mode };
    return { ok: false, reason: res.status === 404 ? 'not_found' : 'refused', status: res.status };
  } catch {
    return { ok: false, reason: 'unreachable' };
  }
}
