import { headers } from 'next/headers';

/**
 * The site's own address, for the QR codes on the booth screens.
 *
 * PUBLIC_SITE_URL wins when it is set (the school server sets it to
 * https://mentalhealth.satitm.chula.ac.th), so a TV opened by IP address or a
 * second hostname still shows the address students should keep. Without it, the
 * address comes from the request itself, behind the reverse proxy's
 * X-Forwarded-* headers, so a test machine shows a code that works on that machine.
 */
export async function siteUrl(path = '/'): Promise<string> {
  const fixed = process.env.PUBLIC_SITE_URL?.trim().replace(/\/+$/, '');
  if (fixed) return `${fixed}${path}`;

  const h = await headers();
  const host = (h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000').split(',')[0].trim();
  const local = /^(localhost|127\.|\[::1\])/.test(host);
  const proto = (h.get('x-forwarded-proto') ?? (local ? 'http' : 'https')).split(',')[0].trim();
  return `${proto}://${host}${path}`;
}
