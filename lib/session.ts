import { randomUUID } from 'node:crypto';

import { festivals, flowerFromChoices, loykrathongQuiz } from '../content/th/booth.ts';
import { questions } from '../content/th/questions.ts';

import { db } from './db.ts';
import { scoreCheckin } from './scoring.ts';
import { getActiveFestival } from './settings.ts';
import type { FestivalId, Mode, ResultState, Topic } from './types';

/**
 * Sessions: one anonymous run of the check-in or the booth quiz (BRIEF §3).
 *
 * The rules that keep this honest, all enforced here rather than trusted from the
 * client:
 *  - an answer must name a question and a choice that exist in the content;
 *  - a result is ALWAYS recomputed from the stored answers, so the client cannot
 *    post one of its own;
 *  - a finished session is immutable: reopening the QR link or pressing "check in
 *    again" makes a NEW session, never an edit of an old one;
 *  - nothing here can store a name, an ID, an IP address or free text, because
 *    there is nowhere to put one.
 *
 * Relative imports with `.ts`, so scripts/test-db.mjs can load this in plain Node.
 */

/** An error the API should report to the caller as-is. Anything else becomes a 500. */
export class ApiError extends Error {
  // Written out longhand, not as constructor parameter properties: Node's
  // type-stripping mode, which loads this file in the tests, only removes type
  // annotations and cannot expand that shorthand.
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string) {
    super(code);
    this.status = status;
    this.code = code;
  }
}

export type Device = 'mobile' | 'tablet' | 'desktop';

/**
 * How many sessions may START in any 60 seconds, across everyone.
 *
 * This replaces the brief's "60 an hour per IP, counted in memory". A counter in
 * memory does nothing on Vercel, where each request can be a fresh instance, and
 * counting per IP would mean storing IPs, which §12 forbids. A single global
 * ceiling needs neither: it is a count of rows already in the table. At the
 * booth's scale (about 30 students, 5 devices) 120 a minute is far above any real
 * use and far below a flood.
 */
export const CREATE_CAP_PER_MINUTE = 120;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

interface SessionRow {
  id: string;
  mode: Mode;
  festival: FestivalId | null;
  completed_at: string | null;
  result_state: ResultState | null;
  primary_topic: Topic | null;
  secondary_topic: Topic | null;
  booth_result: string | null;
}

/** What a finished run comes to. */
export type SessionResult =
  | { mode: 'checkin'; state: ResultState; primary: Topic; secondary: Topic }
  | { mode: 'booth'; flower: string };

export async function createSession(input: { mode: Mode; device?: Device }): Promise<{ id: string }> {
  const c = await db();

  // Global ceiling on new sessions. See CREATE_CAP_PER_MINUTE.
  const since = new Date(Date.now() - 60_000).toISOString();
  const recent = await c.execute({ sql: 'SELECT COUNT(*) AS n FROM session WHERE started_at > ?', args: [since] });
  if (Number(recent.rows[0].n) >= CREATE_CAP_PER_MINUTE) throw new ApiError(429, 'busy');

  // The festival is read on the SERVER at this moment, so statistics stay
  // separable per booth even if the admin switches theme later (§3).
  const active = await getActiveFestival();
  if (input.mode === 'booth' && (active === 'none' || !festivals[active].ready)) {
    throw new ApiError(409, 'no_booth');
  }

  const id = randomUUID();
  await c.execute({
    sql: `INSERT INTO session (id, mode, festival, started_at, device_bucket) VALUES (?, ?, ?, ?, ?)`,
    args: [id, input.mode, active === 'none' ? null : active, new Date().toISOString(), input.device ?? null],
  });
  return { id };
}

async function requireSession(id: string): Promise<SessionRow> {
  // Not a UUID: it cannot exist, so do not spend a query finding out.
  if (!UUID.test(id)) throw new ApiError(404, 'not_found');
  const c = await db();
  const r = await c.execute({
    sql: `SELECT id, mode, festival, completed_at, result_state, primary_topic, secondary_topic, booth_result
          FROM session WHERE id = ?`,
    args: [id],
  });
  const row = r.rows[0];
  if (!row) throw new ApiError(404, 'not_found');
  return {
    id: String(row.id),
    mode: row.mode as Mode,
    festival: (row.festival as FestivalId | null) ?? null,
    completed_at: (row.completed_at as string | null) ?? null,
    result_state: (row.result_state as ResultState | null) ?? null,
    primary_topic: (row.primary_topic as Topic | null) ?? null,
    secondary_topic: (row.secondary_topic as Topic | null) ?? null,
    booth_result: (row.booth_result as string | null) ?? null,
  };
}

/** Is this question, and this choice within it, part of the quiz this session runs? */
function isKnownAnswer(session: SessionRow, questionId: string, choiceId: string): boolean {
  if (session.mode === 'checkin') {
    const q = questions.find((x) => x.id === questionId);
    return !!q?.choices.some((c) => c.id === choiceId);
  }
  // Booth: only Loy Krathong has a quiz yet. A session recorded under any other
  // festival has nothing to answer.
  if (session.festival !== 'loykrathong') return false;
  const q = loykrathongQuiz.find((x) => x.id === questionId);
  return !!q?.choices.some((c) => c.id === choiceId);
}

/** Record an answer. Answering the same question again replaces it (no duplicate). */
export async function saveAnswer(id: string, questionId: string, choiceId: string): Promise<void> {
  const session = await requireSession(id);
  if (session.completed_at) throw new ApiError(409, 'completed');
  if (!isKnownAnswer(session, questionId, choiceId)) throw new ApiError(400, 'unknown_answer');

  const c = await db();
  await c.execute({
    sql: `INSERT INTO answer (session_id, question_id, choice_id, answered_at) VALUES (?, ?, ?, ?)
          ON CONFLICT(session_id, question_id)
          DO UPDATE SET choice_id = excluded.choice_id, answered_at = excluded.answered_at`,
    args: [id, questionId, choiceId, new Date().toISOString()],
  });
}

function storedResult(s: SessionRow): SessionResult | null {
  if (s.mode === 'checkin' && s.result_state && s.primary_topic && s.secondary_topic) {
    return { mode: 'checkin', state: s.result_state, primary: s.primary_topic, secondary: s.secondary_topic };
  }
  if (s.mode === 'booth' && s.booth_result) return { mode: 'booth', flower: s.booth_result };
  return null;
}

/**
 * Finish a session. The result is recomputed here from the stored answers and the
 * server's value is the one kept (§3); the client never supplies one.
 *
 * Completing twice returns the first result unchanged. That is deliberate: the
 * phone retries a failed request once, so the same "complete" can arrive twice,
 * and it must not turn into an error or an overwrite.
 */
export async function completeSession(id: string): Promise<SessionResult> {
  const session = await requireSession(id);
  if (session.completed_at) {
    const kept = storedResult(session);
    if (kept) return kept;
  }

  const c = await db();
  const rows = await c.execute({
    sql: 'SELECT question_id, choice_id FROM answer WHERE session_id = ?',
    args: [id],
  });
  const pairs = rows.rows.map((r) => ({ questionId: String(r.question_id), choiceId: String(r.choice_id) }));
  const now = new Date().toISOString();

  if (session.mode === 'checkin') {
    const scored = scoreCheckin(pairs);
    if (!scored) throw new ApiError(409, 'incomplete');
    await c.execute({
      sql: `UPDATE session SET completed_at = ?, result_state = ?, primary_topic = ?, secondary_topic = ?
            WHERE id = ? AND completed_at IS NULL`,
      args: [now, scored.state, scored.primary, scored.secondary, id],
    });
    return { mode: 'checkin', state: scored.state, primary: scored.primary, secondary: scored.secondary };
  }

  const flower = flowerFromChoices(pairs);
  if (!flower) throw new ApiError(409, 'incomplete');
  await c.execute({
    sql: 'UPDATE session SET completed_at = ?, booth_result = ? WHERE id = ? AND completed_at IS NULL',
    args: [now, flower.id, id],
  });
  return { mode: 'booth', flower: flower.id };
}
