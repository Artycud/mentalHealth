import type { CheckinAnswer } from './scoring.ts';

/**
 * Hands the check-in's answers from the question screens to the result screen.
 *
 * sessionStorage, not localStorage: it lives only in this tab and is gone when
 * the tab closes, so nothing about a student lingers on a shared phone. It holds
 * only choice ids — no name, no identifier, nothing free-typed (BRIEF §12).
 *
 * Every access is wrapped: private windows and blocked site data can make
 * storage throw, and the check-in must still work without it. If it fails the
 * student simply sees the "start again" screen instead of a result.
 */

const KEY = 'cud.checkin.answers';

export function saveAnswers(answers: CheckinAnswer[]): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(answers));
  } catch {
    /* storage unavailable: the result screen will offer to start again */
  }
}

export function clearAnswers(): void {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* nothing to clear */
  }
}

/** The raw stored text. A plain string, so it is a stable snapshot for React. */
export function readRawAnswers(): string | null {
  try {
    return sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
}

/** Parse what was stored, trusting nothing: it is only ever scored, never shown. */
export function parseAnswers(raw: string | null): CheckinAnswer[] | null {
  if (!raw) return null;
  try {
    const data: unknown = JSON.parse(raw);
    if (!Array.isArray(data)) return null;
    const ok = data.every(
      (a) =>
        a !== null &&
        typeof a === 'object' &&
        typeof (a as CheckinAnswer).questionId === 'string' &&
        typeof (a as CheckinAnswer).choiceId === 'string',
    );
    return ok ? (data as CheckinAnswer[]) : null;
  } catch {
    return null;
  }
}
