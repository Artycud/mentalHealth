/**
 * Which AI answers. Chosen by VENT_PROVIDER in the environment:
 *
 *   mock   the development stand-in (lib/vent/mock.ts); the default while developing
 *   none   VENT answers "not available"; the default in production until a real
 *          provider is configured, so a template never reaches students
 *
 * To add the real model: write `lib/vent/<name>.ts` exporting a VentProvider that
 * sends SYSTEM_PROMPT and toTurns(input) (lib/vent/prompt.ts) and returns the
 * model's text; add it below; set VENT_PROVIDER=<name> and its API key on the
 * server. The key is read on the server only and never reaches a browser. Choose a
 * provider that neither keeps nor trains on what is sent (docs/redesign-plan.md §9).
 */

import { mockProvider } from './mock.ts';
import type { VentProvider } from './types.ts';

export function getProvider(): VentProvider | null {
  const dev = process.env.NODE_ENV !== 'production';
  const name = process.env.VENT_PROVIDER || (dev ? 'mock' : 'none');
  switch (name) {
    case 'mock':
      return mockProvider;
    default:
      return null;
  }
}
