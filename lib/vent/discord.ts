/**
 * Telling the พี่สภา team a student has written, in their Discord channel.
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

function headline(urgent: boolean, isNew: boolean) {
  const role = roleId() ? `<@&${roleId()}> ` : '';
  if (urgent) return `${role}⚠️ **ด่วน** มีข้อความที่อาจต้องการความช่วยเหลือ ช่วยดูเร็ว ๆ นะ`;
  return `${role}💬 ${isNew ? 'มีน้องเพิ่งระบายมา' : 'น้องเขียนเพิ่มในแชทเดิม'}`;
}

/**
 * Pings the channel. `origin` is this site (for the inbox link). Returns the
 * Discord message id in bot mode, so the ping can be marked when the chat ends.
 */
export async function notifySapa(p: { ref: string; urgent: boolean; isNew: boolean; origin: string }): Promise<string | null> {
  const mode = discordMode();
  const link = `${p.origin}/sapa?t=${p.ref}`;
  const allowed_mentions = { roles: roleId() ? [roleId()] : [] };

  if (mode === 'bot') {
    const res = await call(`${API}/channels/${channelId()}/messages`, {
      method: 'POST',
      headers: botHeaders(),
      body: JSON.stringify({
        content: headline(p.urgent, p.isNew),
        allowed_mentions,
        components: [
          {
            type: 1,
            components: [
              { type: 2, style: p.urgent ? 4 : 1, label: 'อ่านและตอบ', custom_id: `read:${p.ref}` },
              { type: 2, style: 5, label: 'เปิดในเว็บ', url: link },
            ],
          },
        ],
      }),
    });
    if (!res?.ok) return null;
    try {
      return String(((await res.json()) as { id: string }).id);
    } catch {
      return null;
    }
  }

  if (mode === 'webhook') {
    await call(webhookUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: `${headline(p.urgent, p.isNew)}\n${link}`, allowed_mentions }),
    });
  }
  return null;
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
