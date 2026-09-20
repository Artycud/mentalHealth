import { admin, WIPE_WORD } from '../content/th/admin.ts';
import { festivals, loykrathongFlowers, loykrathongQuiz } from '../content/th/booth.ts';
import { questions, topicLabels } from '../content/th/questions.ts';

import { db } from './db.ts';
import { parseIsoDate } from './thai-date.ts';
import type { FestivalId, Mode, ResultState, Topic } from './types';

/**
 * What the admin panel reads and does to the data (BRIEF §11).
 *
 * Everything here is aggregate or anonymous: a session is a time, a mode, the
 * answers and the result, and there is no column that could say whose it was. The
 * panel never adds a way to trace one back to a person (§12).
 *
 * "Day" always means a day in Thailand (UTC+7, which has no daylight saving), the
 * same as the TV's "today", so a session at 00:30 in Bangkok belongs to the new day.
 * Every query is parameterised: the filters come from the address bar, and none of
 * them is ever pasted into SQL.
 *
 * Relative imports with `.ts`, so scripts/test-admin.mjs can load this in plain Node.
 */

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
const BANGKOK = 7 * HOUR;
const UUID_PART = /^[0-9a-f-]{1,36}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** How many sessions the panel lists at once. The exports and the numbers cover them all. */
export const LIST_LIMIT = 500;
/** A sanity ceiling on what one request loads. Far above a school's booth. */
const HARD_LIMIT = 50_000;

// ---- days in Thailand ----

/** "2026-11-19" for a UTC instant, read on Thailand's calendar. */
export const thaiDay = (iso: string): string => new Date(Date.parse(iso) + BANGKOK).toISOString().slice(0, 10);

/** The UTC instant a Thailand calendar day begins. */
const dayStartUtc = (day: string): number => {
  const [y, m, d] = day.split('-').map(Number);
  return Date.UTC(y, m - 1, d) - BANGKOK;
};

/** "2026-11-19 11:32:07" in Thailand time, for a spreadsheet. */
export const thaiDateTime = (iso: string): string => new Date(Date.parse(iso) + BANGKOK).toISOString().slice(0, 19).replace('T', ' ');

/** "11:32" in Thailand time. */
export const thaiClock = (iso: string): string => new Date(Date.parse(iso) + BANGKOK).toISOString().slice(11, 16);

// ---- filters ----

export interface Filters {
  /** First Thailand day to include, "YYYY-MM-DD". */
  from?: string;
  /** Last Thailand day to include, inclusive. */
  to?: string;
  mode?: Mode;
  status?: 'done' | 'open';
  festival?: FestivalId;
  /** The start of a session id. */
  q?: string;
}

type Raw = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)?.trim() || undefined;

/** Filters from the address bar. Anything that is not a valid value is simply not applied. */
export function parseFilters(raw: Raw): Filters {
  const f: Filters = {};
  const from = one(raw.from);
  const to = one(raw.to);
  const mode = one(raw.mode);
  const status = one(raw.status);
  const festival = one(raw.festival);
  const q = one(raw.q)?.toLowerCase();
  if (from && parseIsoDate(from)) f.from = from;
  if (to && parseIsoDate(to)) f.to = to;
  if (mode === 'checkin' || mode === 'booth') f.mode = mode;
  if (status === 'done' || status === 'open') f.status = status;
  if (festival && Object.hasOwn(festivals, festival)) f.festival = festival as FestivalId;
  if (q) f.q = q.slice(0, 36);
  return f;
}

/** The filters as a query string ("" when there are none), for links and exports. */
export function filtersToQuery(f: Filters): string {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(f)) if (v) p.set(k, String(v));
  const s = p.toString();
  return s ? `?${s}` : '';
}

function where(f: Filters, alias = ''): { sql: string; args: (string | number)[] } {
  const col = (name: string) => (alias ? `${alias}.${name}` : name);
  const conds: string[] = [];
  const args: (string | number)[] = [];
  if (f.from) {
    conds.push(`${col('started_at')} >= ?`);
    args.push(new Date(dayStartUtc(f.from)).toISOString());
  }
  if (f.to) {
    conds.push(`${col('started_at')} < ?`);
    args.push(new Date(dayStartUtc(f.to) + DAY).toISOString());
  }
  if (f.mode) {
    conds.push(`${col('mode')} = ?`);
    args.push(f.mode);
  }
  if (f.status === 'done') conds.push(`${col('completed_at')} IS NOT NULL`);
  if (f.status === 'open') conds.push(`${col('completed_at')} IS NULL`);
  if (f.festival) {
    conds.push(`${col('festival')} = ?`);
    args.push(f.festival);
  }
  if (f.q) {
    if (UUID_PART.test(f.q)) {
      conds.push(`${col('id')} LIKE ?`);
      args.push(`${f.q}%`);
    } else {
      conds.push('1 = 0'); // not a possible id, so nothing can match
    }
  }
  return { sql: conds.length ? `WHERE ${conds.join(' AND ')}` : '', args };
}

// ---- labels ----

const checkinById = new Map(questions.map((q) => [q.id, q]));
const boothById = new Map(loykrathongQuiz.map((q) => [q.id, q]));

/** The question's Thai headline, or its id if it is no longer in the content. */
export function questionLabel(questionId: string): string {
  return checkinById.get(questionId)?.headline ?? boothById.get(questionId)?.headline ?? questionId;
}

/** The chosen answer's Thai label, or its id if the content has since changed. */
export function choiceLabel(questionId: string, choiceId: string): string {
  const check = checkinById.get(questionId)?.choices.find((c) => c.id === choiceId)?.label;
  if (check) return check;
  return boothById.get(questionId)?.choices.find((c) => c.id === choiceId)?.label ?? choiceId;
}

const topicName = (t: string | null) => (t ? (topicLabels[t as Topic] ?? t) : '');
const flowerName = (id: string | null) => (id ? (loykrathongFlowers.find((f) => f.id === id)?.name ?? id) : '');
export const festivalName = (id: string | null) => (id && Object.hasOwn(festivals, id) ? festivals[id as FestivalId].name : (id ?? ''));

// ---- what the panel shows ----

export interface AdminAnswer {
  questionId: string;
  question: string;
  choiceId: string;
  choice: string;
}

export interface AdminSession {
  id: string;
  mode: Mode;
  festival: string | null;
  festivalName: string;
  /** UTC ISO, as stored. */
  startedAt: string;
  completedAt: string | null;
  /** Thailand day, "YYYY-MM-DD". */
  day: string;
  /** Thailand clock time of the start, "11:32". */
  clock: string;
  durationSeconds: number | null;
  state: ResultState | null;
  primary: string;
  secondary: string;
  flower: string;
  device: string | null;
  answers: AdminAnswer[];
}

export interface QuestionStat {
  id: string;
  headline: string;
  /** How many sessions answered this question. */
  answered: number;
  choices: { id: string; label: string; count: number; pct: number }[];
}

export interface AdminData {
  summary: {
    total: number;
    completed: number;
    /** 0–1, or null with nothing to divide. */
    rate: number | null;
    /** Sessions started today in Thailand, whatever the filters. */
    today: number;
    /** Median seconds from start to finish, over finished sessions. */
    medianSeconds: number | null;
    first: string | null;
    last: string | null;
  };
  perDay: { day: string; total: number; completed: number }[];
  states: { state: ResultState; count: number }[];
  flowers: { id: string; name: string; count: number }[];
  checkinQuestions: QuestionStat[];
  boothQuestions: QuestionStat[];
  sessions: AdminSession[];
}

interface SessionRow {
  id: string;
  mode: Mode;
  festival: string | null;
  started_at: string;
  completed_at: string | null;
  result_state: ResultState | null;
  primary_topic: string | null;
  secondary_topic: string | null;
  booth_result: string | null;
  device_bucket: string | null;
}

async function loadRows(f: Filters): Promise<SessionRow[]> {
  const c = await db();
  const w = where(f);
  const r = await c.execute({
    sql: `SELECT id, mode, festival, started_at, completed_at, result_state, primary_topic,
                 secondary_topic, booth_result, device_bucket
          FROM session ${w.sql} ORDER BY started_at DESC LIMIT ${HARD_LIMIT}`,
    args: w.args,
  });
  return r.rows as unknown as SessionRow[];
}

const seconds = (row: SessionRow): number | null =>
  row.completed_at ? Math.max(0, Math.round((Date.parse(row.completed_at) - Date.parse(row.started_at)) / 1000)) : null;

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2);
}

async function answerStats(f: Filters, all: typeof questions | typeof loykrathongQuiz, mode: Mode): Promise<QuestionStat[]> {
  const counts = new Map<string, number>();
  // A filter for the other mode leaves this one empty, by design.
  if (!f.mode || f.mode === mode) {
    const c = await db();
    const w = where({ ...f, mode }, 's');
    const r = await c.execute({
      sql: `SELECT a.question_id AS q, a.choice_id AS c, COUNT(*) AS n
            FROM answer a JOIN session s ON s.id = a.session_id ${w.sql}
            GROUP BY a.question_id, a.choice_id`,
      args: w.args,
    });
    for (const row of r.rows) counts.set(`${row.q}|${row.c}`, Number(row.n));
  }
  return all.map((q) => {
    const choices = q.choices.map((ch) => ({ id: ch.id, label: ch.label, count: counts.get(`${q.id}|${ch.id}`) ?? 0 }));
    const answered = choices.reduce((sum, ch) => sum + ch.count, 0);
    return {
      id: q.id,
      headline: q.headline,
      answered,
      choices: choices.map((ch) => ({ ...ch, pct: answered ? Math.round((ch.count / answered) * 100) : 0 })),
    };
  });
}

/** Everything the dashboard shows for a set of filters. */
export async function getAdminData(f: Filters, nowMs = Date.now()): Promise<AdminData> {
  const c = await db();
  const rows = await loadRows(f);

  const done = rows.filter((r) => r.completed_at);
  const durations = done.map(seconds).filter((s): s is number => s !== null);

  const todayStartMs = dayStartUtc(thaiDay(new Date(nowMs).toISOString()));
  const todayCount = Number(
    (
      await c.execute({
        sql: 'SELECT COUNT(*) AS n FROM session WHERE started_at >= ? AND started_at < ?',
        args: [new Date(todayStartMs).toISOString(), new Date(todayStartMs + DAY).toISOString()],
      })
    ).rows[0].n,
  );

  const perDay = new Map<string, { total: number; completed: number }>();
  for (const r of rows) {
    const d = thaiDay(r.started_at);
    const e = perDay.get(d) ?? { total: 0, completed: 0 };
    e.total += 1;
    if (r.completed_at) e.completed += 1;
    perDay.set(d, e);
  }

  const stateCounts = new Map<ResultState, number>();
  const flowerCounts = new Map<string, number>();
  for (const r of done) {
    if (r.mode === 'checkin' && r.result_state) stateCounts.set(r.result_state, (stateCounts.get(r.result_state) ?? 0) + 1);
    if (r.mode === 'booth' && r.booth_result) flowerCounts.set(r.booth_result, (flowerCounts.get(r.booth_result) ?? 0) + 1);
  }

  // The list: the newest LIST_LIMIT, each with its answers in question order.
  const shown = rows.slice(0, LIST_LIMIT);
  const answersBySession = new Map<string, AdminAnswer[]>();
  if (shown.length) {
    const ids = shown.map((r) => r.id);
    const ar = await c.execute({
      sql: `SELECT session_id, question_id, choice_id FROM answer
            WHERE session_id IN (${ids.map(() => '?').join(', ')}) ORDER BY answered_at, id`,
      args: ids,
    });
    for (const a of ar.rows) {
      const list = answersBySession.get(String(a.session_id)) ?? [];
      list.push({
        questionId: String(a.question_id),
        question: questionLabel(String(a.question_id)),
        choiceId: String(a.choice_id),
        choice: choiceLabel(String(a.question_id), String(a.choice_id)),
      });
      answersBySession.set(String(a.session_id), list);
    }
  }

  const order = ['ok', 'thinking', 'drained', 'heavy'] as const;
  const started = rows.map((r) => r.started_at);
  return {
    summary: {
      total: rows.length,
      completed: done.length,
      rate: rows.length ? done.length / rows.length : null,
      today: todayCount,
      medianSeconds: median(durations),
      first: started.length ? started[started.length - 1] : null,
      last: started.length ? started[0] : null,
    },
    perDay: [...perDay.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([day, v]) => ({ day, ...v })),
    states: order.map((state) => ({ state, count: stateCounts.get(state) ?? 0 })),
    flowers: loykrathongFlowers.map((fl) => ({ id: fl.id, name: fl.name, count: flowerCounts.get(fl.id) ?? 0 })),
    checkinQuestions: await answerStats(f, questions, 'checkin'),
    boothQuestions: await answerStats(f, loykrathongQuiz, 'booth'),
    sessions: shown.map((r) => ({
      id: r.id,
      mode: r.mode,
      festival: r.festival,
      festivalName: festivalName(r.festival),
      startedAt: r.started_at,
      completedAt: r.completed_at,
      day: thaiDay(r.started_at),
      clock: thaiClock(r.started_at),
      durationSeconds: seconds(r),
      state: r.result_state,
      primary: topicName(r.primary_topic),
      secondary: topicName(r.secondary_topic),
      flower: flowerName(r.booth_result),
      device: r.device_bucket,
      answers: answersBySession.get(r.id) ?? [],
    })),
  };
}

// ---- export ----

/**
 * One CSV field. Quoted when it has to be, and a field that a spreadsheet could read as
 * a formula (starting = + - @) is made harmless with a leading quote mark.
 */
function csvField(value: string | number | null): string {
  let s = value === null ? '' : String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** UTF-8 with a byte-order mark, so Excel opens the Thai correctly. */
const BOM = '﻿';
const csv = (rows: (string | number | null)[][]) => BOM + rows.map((r) => r.map(csvField).join(',')).join('\r\n') + '\r\n';

/** One row per session, honouring the filters. */
export async function sessionsCsv(f: Filters): Promise<string> {
  const rows = await loadRows(f);
  return csv([
    ['session_id', 'mode', 'festival', 'started_th', 'completed_th', 'seconds', 'finished', 'result_state', 'primary_topic', 'secondary_topic', 'flower', 'device'],
    ...[...rows].reverse().map((r) => [
      r.id,
      admin.modes[r.mode],
      festivalName(r.festival),
      thaiDateTime(r.started_at),
      r.completed_at ? thaiDateTime(r.completed_at) : '',
      seconds(r),
      r.completed_at ? 'yes' : 'no',
      r.result_state ? admin.states[r.result_state] : '',
      topicName(r.primary_topic),
      topicName(r.secondary_topic),
      flowerName(r.booth_result),
      r.device_bucket,
    ]),
  ]);
}

/** One row per answer, honouring the filters. */
export async function answersCsv(f: Filters): Promise<string> {
  const c = await db();
  const w = where(f, 's');
  const r = await c.execute({
    sql: `SELECT s.id AS sid, s.mode AS mode, s.festival AS festival, a.question_id AS q, a.choice_id AS ch, a.answered_at AS at
          FROM answer a JOIN session s ON s.id = a.session_id ${w.sql}
          ORDER BY s.started_at, a.answered_at, a.id LIMIT ${HARD_LIMIT * 10}`,
    args: w.args,
  });
  return csv([
    ['session_id', 'mode', 'festival', 'answered_th', 'question_id', 'question', 'choice_id', 'choice'],
    ...r.rows.map((row) => [
      String(row.sid),
      admin.modes[row.mode as Mode],
      festivalName(String(row.festival)),
      thaiDateTime(String(row.at)),
      String(row.q),
      questionLabel(String(row.q)),
      String(row.ch),
      choiceLabel(String(row.q), String(row.ch)),
    ]),
  ]);
}

/** A filename for a download: the kind, and today's date in Thailand. */
export const exportFilename = (kind: 'sessions' | 'answers', nowMs = Date.now()) =>
  `cud-mental-health-${kind}-${thaiDay(new Date(nowMs).toISOString())}.csv`;

// ---- delete ----

/** Deletes one session and its answers. Returns how many sessions were removed (0 or 1). */
export async function deleteSession(id: string): Promise<number> {
  if (!UUID.test(id)) return 0;
  const c = await db();
  await c.execute({ sql: 'DELETE FROM answer WHERE session_id = ?', args: [id] });
  return (await c.execute({ sql: 'DELETE FROM session WHERE id = ?', args: [id] })).rowsAffected;
}

/**
 * Deletes every session and answer. Settings, dates and accounts are kept: this is
 * "the report is done, clear the answers", not a factory reset. The caller must have
 * been given the confirmation word by a person typing it.
 */
export async function wipeAll(confirm: string): Promise<number> {
  if (confirm.trim() !== WIPE_WORD) throw new Error('confirmation does not match');
  const c = await db();
  await c.execute('DELETE FROM answer');
  return (await c.execute('DELETE FROM session')).rowsAffected;
}
