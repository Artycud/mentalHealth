/**
 * How the admin panel talks to /api/admin/*. One place, so every control handles a
 * dead connection and an expired sign-in the same way.
 */
export interface Sent {
  ok: boolean;
  status: number;
  // The bodies are small JSON objects the panel's own API returns.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
}

export async function send(url: string, method: 'POST' | 'PUT' | 'DELETE', body?: unknown): Promise<Sent> {
  try {
    const res = await fetch(url, {
      method,
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    let data = null;
    try {
      data = await res.json();
    } catch {
      /* an empty or non-JSON body */
    }
    // The 8 hours are up (or the cookie is gone): go and sign in again.
    // A full page load, on purpose: it drops every piece of state the expired session had.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    if (res.status === 401 && !url.endsWith('/login')) window.location.assign('/admin/login');
    return { ok: res.ok, status: res.status, data };
  } catch {
    return { ok: false, status: 0, data: null };
  }
}
