import { databaseInfo, db } from '@/lib/db';

/**
 * GET /api/health: is the site up, and which database is it using. Says only which
 * setting chose the database and what kind it is (turso / hosted / file / memory),
 * never its address or token, plus whether it answers and when it was created. A
 * `file` or `memory` database on Vercel is wiped by every deploy.
 */
export async function GET() {
  const info = databaseInfo();
  let reachable = false;
  let since: string | null = null;
  try {
    const c = await db();
    const r = await c.execute("SELECT MIN(updated_at) AS since FROM setting");
    reachable = true;
    since = r.rows[0]?.since ? String(r.rows[0].since) : null;
  } catch {
    /* reachable stays false */
  }
  return Response.json({ ...info, reachable, since, vercel: Boolean(process.env.VERCEL) }, { headers: { 'Cache-Control': 'no-store' } });
}
