/**
 * The VENT contract: what the page sends, what an AI provider must return, and
 * what the page gets back. Provider-agnostic, so the model behind it can change
 * without touching the page.
 */

import { z } from 'zod';

/** One line of the conversation as the page holds it. Never stored anywhere. */
export interface VentMessage {
  role: 'user' | 'ai';
  text: string;
}

/** Where the check-up left the student's heart, if they came from it: "row-col". */
export type FeelId = `${0 | 1 | 2}-${0 | 1 | 2}`;

export interface VentInput {
  messages: VentMessage[];
  /** Today's heart in plain words ("เหนื่อยใจ"), when known. Context only. */
  feeling?: string;
}

/** The feelings an answer may colour the heart with. Never shown as a label. */
export const FEELINGS = ['light', 'okay', 'tired', 'heavy', 'tense', 'mixed'] as const;
export type Feeling = (typeof FEELINGS)[number];

/**
 * What a provider must answer with, checked before anything reaches the page.
 * `heard` must be the student's own words, copied exactly; the server checks.
 */
export const ProviderReply = z.object({
  heard: z.string().trim().max(80).optional(),
  reply: z.array(z.string().trim().min(1).max(240)).min(1).max(4),
  feeling: z.enum(FEELINGS).optional(),
  risk: z.enum(['none', 'concern', 'urgent']),
});
export type ProviderReply = z.infer<typeof ProviderReply>;

/** What the page receives. */
export type VentResponse =
  | { kind: 'reply'; heard?: string; lines: string[]; feeling?: Feeling; concern?: boolean; mock?: boolean }
  | { kind: 'care' }
  | { kind: 'busy' }
  | { kind: 'unavailable' };

export interface VentProvider {
  /** For the page's development label; never shown in production. */
  readonly mock: boolean;
  /** Returns the model's raw answer: a JSON string or an object. Validated by the caller. */
  respond(input: VentInput, signal: AbortSignal): Promise<unknown>;
}
