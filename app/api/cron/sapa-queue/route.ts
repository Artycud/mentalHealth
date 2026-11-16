import { sweepQueue } from '@/lib/vent/discord';
import { json } from '@/lib/vent/http';

/**
 * GET /api/cron/sapa-queue — the scheduled look at ระบาย's queue (every 10 minutes
 * or so): pings the พี่สภา channel if chats came in during a cooldown, and tags
 * @everyone when someone has waited 30 minutes (lib/vent/discord.ts sweepQueue).
 * The same check also runs while a waiting student has the page open; this covers
 * the quiet times when nobody does.
 *
 * Needs CRON_SECRET: the caller sends "Authorization: Bearer <CRON_SECRET>"
 * (Vercel Cron does this by itself; an outside scheduler sets the header).
 */
export async function GET(request: Request) {
  const secret = (process.env.CRON_SECRET ?? '').trim();
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) return json({ error: 'unauthorized' }, 401);
  try {
    return json({ result: await sweepQueue(new URL(request.url).origin, true) });
  } catch (error) {
    console.error('cron sapa-queue: failed', error instanceof Error ? error.name : 'unknown');
    return json({ error: 'unavailable' }, 503);
  }
}
