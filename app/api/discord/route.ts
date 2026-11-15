import { addMessage, MAX_CHARS, readForStaff } from '@/lib/vent/threads';

/**
 * POST /api/discord — Discord's "Interactions Endpoint URL" for the พี่สภา bot
 * (lib/vent/discord.ts). Lets a พี่ read and answer a ระบาย conversation without
 * leaving Discord:
 *   "อ่านและตอบ" (read:<ref>)  shows the conversation to that พี่ only (ephemeral)
 *   "ตอบ"        (reply:<ref>) opens a box to write in
 *   the box sent (send:<ref>)  saves the answer, which the student then sees
 *
 * Every request is checked against DISCORD_PUBLIC_KEY (Discord signs them); one
 * that fails is refused, as Discord requires. Only people who can see the staff
 * channel can press the buttons, so keep that channel to the team.
 */

const EPHEMERAL = 64;

const hex = (s: string) => Uint8Array.from(s.match(/.{1,2}/g) ?? [], (b) => parseInt(b, 16));

async function verified(request: Request, body: string): Promise<boolean> {
  const key = process.env.DISCORD_PUBLIC_KEY;
  const signature = request.headers.get('x-signature-ed25519');
  const timestamp = request.headers.get('x-signature-timestamp');
  if (!key || !signature || !timestamp) return false;
  try {
    const publicKey = await crypto.subtle.importKey('raw', hex(key), { name: 'Ed25519' }, false, ['verify']);
    return await crypto.subtle.verify('Ed25519', publicKey, hex(signature), new TextEncoder().encode(timestamp + body));
  } catch {
    return false;
  }
}

const reply = (data: object) => Response.json({ type: 4, data: { flags: EPHEMERAL, allowed_mentions: { parse: [] }, ...data } });

/** The conversation as one private Discord message (they are capped at 2,000 characters). */
function transcript(messages: { sender: string; body: string }[]): string {
  const lines = messages.map((m) => `**${m.sender === 'student' ? 'น้อง' : 'พี่สภา'}:** ${m.body}`);
  let text = lines.join('\n\n');
  while (text.length > 1900 && lines.length > 1) {
    lines.shift();
    text = `… (ข้อความเก่ากว่านี้ดูในเว็บ)\n\n${lines.join('\n\n')}`;
  }
  return text.slice(0, 1990);
}

export async function POST(request: Request) {
  const body = await request.text();
  if (!(await verified(request, body))) return new Response('invalid request signature', { status: 401 });

  let i: {
    type: number;
    data?: { custom_id?: string; components?: { components?: { custom_id?: string; value?: string }[] }[] };
  };
  try {
    i = JSON.parse(body);
  } catch {
    return new Response('bad request', { status: 400 });
  }

  // Discord checking the endpoint is alive.
  if (i.type === 1) return Response.json({ type: 1 });

  const [action, ref] = String(i.data?.custom_id ?? '').split(':');
  if (!ref) return reply({ content: 'ไม่รู้จักปุ่มนี้' });

  try {
    // A button on the ping, or on the private transcript.
    if (i.type === 3 && action === 'read') {
      const thread = await readForStaff(ref);
      if (!thread) return reply({ content: 'แชทนี้จบไปแล้ว ข้อความถูกลบหมดแล้ว' });
      return reply({
        content: transcript(thread.messages),
        components: [{ type: 1, components: [{ type: 2, style: 1, label: 'ตอบ', custom_id: `reply:${ref}` }] }],
      });
    }

    if (i.type === 3 && action === 'reply') {
      return Response.json({
        type: 9,
        data: {
          custom_id: `send:${ref}`,
          title: 'ตอบน้องในนามพี่สภา',
          components: [
            {
              type: 1,
              components: [
                {
                  type: 4,
                  custom_id: 'text',
                  label: 'ข้อความถึงน้อง',
                  style: 2,
                  min_length: 1,
                  max_length: MAX_CHARS,
                  required: true,
                  placeholder: 'ตอบแบบพี่คุยกับน้อง ไม่ต้องรีบสอน ไม่ต้องตัดสิน',
                },
              ],
            },
          ],
        },
      });
    }

    // The answer box, sent.
    if (i.type === 5 && action === 'send') {
      const text = String(i.data?.components?.[0]?.components?.[0]?.value ?? '').trim();
      if (!text) return reply({ content: 'ยังไม่ได้พิมพ์อะไรเลย' });
      const saved = await addMessage({ ref }, 'sapa', text.slice(0, MAX_CHARS));
      if (!saved) return reply({ content: 'แชทนี้จบไปแล้ว ข้อความไม่ได้ส่ง' });
      if (saved.full) return reply({ content: 'แชทนี้ยาวถึงขีดสุดแล้ว ชวนน้องเริ่มแชทใหม่หรือแนะนำ CUD Care นะ' });
      return reply({ content: '✓ ส่งถึงน้องแล้ว น้องจะเห็นในหน้าระบายของตัวเอง' });
    }
  } catch (error) {
    console.error('discord interaction: failed', error instanceof Error ? error.name : 'unknown');
    return reply({ content: 'มีปัญหาชั่วคราว ลองใหม่อีกทีหรือตอบในเว็บแทนนะ' });
  }

  return reply({ content: 'ไม่รู้จักปุ่มนี้' });
}
