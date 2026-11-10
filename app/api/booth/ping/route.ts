import { connection } from 'next/server';

/**
 * GET /api/booth/ping: "is the server reachable right now?", for the booth TV.
 *
 * The TV refreshes itself every few seconds with router.refresh(). In this Next.js
 * version a refresh that fails (no network, or the server mid-restart) turns into a
 * full page load, and a full page load with no server leaves the browser's own
 * error page on the TV until someone walks over and reloads it. So the TV asks
 * here first and only refreshes when this answers (components/booth/AutoRefresh).
 *
 * Reads nothing, needs no login, and says nothing but the time: it is safe for
 * anyone to call.
 */
export async function GET() {
  // Answered per request, never prerendered or cached, or it would answer "up"
  // from a cache while the server was down.
  await connection();
  return Response.json({ ok: true, at: Date.now() }, { headers: { 'Cache-Control': 'no-store' } });
}
