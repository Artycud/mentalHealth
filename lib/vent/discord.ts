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

export function discordMode(env = process.env): DiscordMode {
  if (env.DISCORD_BOT_TOKEN && env.DISCORD_CHANNEL_ID && env.DISCORD_PUBLIC_KEY) return 'bot';
  if (env.DISCORD_WEBHOOK_URL) return 'webhook';
  return null;
}

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

const botHeaders = () => ({ Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`, 'Content-Type': 'application/json' });

function headline(urgent: boolean, isNew: boolean) {
  const role = process.env.DISCORD_ROLE_ID ? `<@&${process.env.DISCORD_ROLE_ID}> ` : '';
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
  const allowed_mentions = { roles: process.env.DISCORD_ROLE_ID ? [process.env.DISCORD_ROLE_ID] : [] };

  if (mode === 'bot') {
    const res = await call(`${API}/channels/${process.env.DISCORD_CHANNEL_ID}/messages`, {
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
    await call(process.env.DISCORD_WEBHOOK_URL!, {
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
  await call(`${API}/channels/${process.env.DISCORD_CHANNEL_ID}/messages/${discordId}`, {
    method: 'PATCH',
    headers: botHeaders(),
    body: JSON.stringify({ content: '✔️ แชทนี้จบแล้ว ข้อความถูกลบหมดแล้ว', components: [] }),
  });
}
