import { z } from 'zod';

import { ApiError } from './session.ts';

/**
 * Shared plumbing for the API routes: read a small JSON body safely, validate it
 * with zod, and turn errors into plain JSON responses.
 *
 * Every rule about what an answer or a session may be lives in lib/session.ts;
 * the routes only translate. That keeps the rules in one tested place.
 */

/** No request to these routes has a legitimate reason to be bigger than this. */
export const MAX_BODY_BYTES = 2048;

/** Read the body as JSON, refusing anything oversized or malformed. */
export async function readJson(request: Request): Promise<unknown> {
  // Refuse on the declared size first, without reading a byte of it.
  const declared = Number(request.headers.get('content-length') ?? 0);
  if (declared > MAX_BODY_BYTES) throw new ApiError(413, 'too_large');

  const text = await request.text();
  // The header can lie or be missing (chunked uploads), so check what arrived too.
  if (text.length > MAX_BODY_BYTES) throw new ApiError(413, 'too_large');
  if (text.trim() === '') return {};
  try {
    return JSON.parse(text);
  } catch {
    throw new ApiError(400, 'bad_json');
  }
}

/** Validate against a zod schema, or refuse with a 400. */
export function parse<T extends z.ZodTypeAny>(schema: T, data: unknown): z.infer<T> {
  const result = schema.safeParse(data);
  if (!result.success) throw new ApiError(400, 'bad_request');
  return result.data;
}

/** A JSON response that nothing may cache: these are per-student, per-moment. */
export function ok(data: unknown, status = 200): Response {
  return Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
}

/**
 * Turn anything thrown into a response. An ApiError says what went wrong in a
 * short code. Anything else is logged here and reported as a bare 500 — the
 * caller never sees an internal message, a query or a stack.
 */
export function fail(error: unknown): Response {
  if (error instanceof ApiError) return ok({ error: error.code }, error.status);
  console.error('api error', error);
  return ok({ error: 'server' }, 500);
}
