/**
 * Shared by the ระบาย API routes (app/api/vent): reading a small JSON body
 * safely, and the shape of a student's message.
 *
 * PRIVACY: what a student wrote is never logged or echoed in an error. Failures
 * are logged by name only.
 */

import { z } from 'zod';

import { MAX_CHARS } from './threads.ts';

/** 1,200 Thai characters is about 3,600 bytes; leave room for the JSON around it. */
const MAX_BYTES = 8_000;

export const Text = z.string().trim().min(1).max(MAX_CHARS);

/** The body as JSON, or null when it is missing, too big or not JSON. */
export async function smallJson(request: Request): Promise<unknown | null> {
  if (Number(request.headers.get('content-length') ?? 0) > MAX_BYTES) return null;
  const text = await request.text();
  if (text.length > MAX_BYTES) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });

export function failed(where: string, error: unknown) {
  console.error(`vent ${where}: failed`, error instanceof Error ? error.name : 'unknown');
  return json({ error: 'unavailable' }, 503);
}
