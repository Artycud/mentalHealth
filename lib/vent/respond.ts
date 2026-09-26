/**
 * One VENT turn, start to finish, on the server:
 *
 *   1. the safety net (lib/vent/safety.ts) on the newest message: a match
 *      answers with the reviewed care screen, and the AI is never asked;
 *   2. the provider, with a time limit;
 *   3. its answer checked against the contract, one retry if it is malformed;
 *   4. `heard` kept only if it really is the student's own words;
 *   5. the AI's own "urgent" also turns into the care screen.
 *
 * PRIVACY: nothing here stores or logs what the student wrote. A failure is
 * logged by its error NAME only, because an error's message or cause can carry
 * the request, and the request is the student's writing.
 */

import { needsCare } from './safety.ts';
import { ProviderReply, type VentInput, type VentProvider, type VentResponse } from './types.ts';

export const TIMEOUT_MS = 12_000;

/** Spaces and zero-width characters don't count when checking a quote. */
const loose = (s: string) => s.normalize('NFC').replace(/[\s​-‍﻿]+/g, '');

function withTimeout(provider: VentProvider, input: VentInput, ms: number): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return Promise.race([
    provider.respond(input, controller.signal),
    new Promise((_, reject) => controller.signal.addEventListener('abort', () => reject(new Error('timeout')))),
  ]).finally(() => clearTimeout(timer));
}

function read(raw: unknown): ProviderReply | null {
  let value = raw;
  if (typeof raw === 'string') {
    // Models sometimes wrap JSON in a code fence; take the object inside.
    const match = raw.match(/\{[\s\S]*\}/);
    try {
      value = match ? JSON.parse(match[0]) : null;
    } catch {
      return null;
    }
  }
  const parsed = ProviderReply.safeParse(value);
  return parsed.success ? parsed.data : null;
}

export async function respond(
  input: VentInput,
  provider: VentProvider | null,
  timeoutMs = TIMEOUT_MS,
): Promise<VentResponse> {
  const latest = [...input.messages].reverse().find((m) => m.role === 'user')?.text ?? '';
  if (needsCare(latest)) return { kind: 'care' };
  if (!provider) return { kind: 'unavailable' };

  let reply: ProviderReply | null = null;
  for (let attempt = 0; attempt < 2 && !reply; attempt += 1) {
    try {
      reply = read(await withTimeout(provider, input, timeoutMs));
    } catch (error) {
      console.error('vent: provider failed', error instanceof Error ? error.name : 'unknown');
      if (error instanceof Error && error.message === 'timeout') break; // a second wait is too long
    }
  }
  if (!reply) return { kind: 'unavailable' };
  if (reply.risk === 'urgent') return { kind: 'care' };

  const heard = reply.heard && loose(latest).includes(loose(reply.heard)) ? reply.heard : undefined;
  return {
    kind: 'reply',
    heard,
    lines: reply.reply,
    feeling: reply.feeling,
    concern: reply.risk === 'concern' || undefined,
    mock: provider.mock || undefined,
  };
}
