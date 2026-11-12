import { festivalOrder, festivals, loykrathongFlowers, loykrathongQuiz, okayQuestion } from '../content/th/booth.ts';

import { getAdminData, thaiDay } from './admin-data.ts';
import { db } from './db.ts';
import { getEvent } from './events.ts';
import { formatDateRange } from './thai-date.ts';
import type { FestivalId, Tint } from './types';

/**
 * The booth's day, summed up for an Instagram story or post (the admin's recap page).
 *
 * Everything here is a total over finished booth sessions: no session, time or answer
 * of any one person ever leaves this file. The one sensitive number — how many said
 * "okay" while not really okay — is going on a public post, so it has a stricter
 * guard than the TV's: at least RECAP_OKAY_MIN answers, rounded to a whole "n in
 * 10" (BRIEF §12).
 *
 * Relative imports with `.ts`, so scripts/test-recap.mjs can load this in plain Node.
 */

const HOUR = 3_600_000;
const BANGKOK = 7 * HOUR;
const SLOT_MIN = 10;

/** The honest question's share is shown only from this many answers. */
export const RECAP_OKAY_MIN = 20;
/** The busiest slot is worth naming only with this many in it. */
const PEAK_MIN = 3;

export interface RecapFlower {
  id: string;
  name: string;
  tint: Tint;
  count: number;
  /** Of finished booth sessions, 0–100. */
  pct: number;
}

export interface RecapQuestion {
  id: string;
  headline: string;
  answered: number;
  choices: { id: string; label: string; count: number; pct: number }[];
}

export interface Recap {
  festival: FestivalId;
  festivalName: string;
  /** "19 พ.ย. 2569", or "19–20 พ.ย. 2569" for the whole booth. */
  dateLabel: string;
  /** The Thailand day shown, or null for every day of the booth. */
  day: string | null;
  /** Days that have a finished booth session, oldest first: the page's day picker. */
  days: string[];
  /** Finished booth sessions. */
  players: number;
  /** Median seconds from start to finish. */
  medianSeconds: number | null;
  /** The busiest 10 minutes, on the Thai clock ("12.10"), or null if nothing stands out. */
  peak: { from: string; to: string; count: number } | null;
  /** Most chosen first. */
  flowers: RecapFlower[];
  /** The three flower questions, in order. */
  questions: RecapQuestion[];
  /** The honest question, as whole tenths, or null below RECAP_OKAY_MIN answers. */
  okay: { answered: number; hide: number; depends: number; real: number } | null;
  /** The next booth after this one, if its dates are later. */
  next: { name: string; date: string } | null;
  /** True for invented numbers (?demo=1, never in production). */
  sample: boolean;
}

/** "12.10" for minutes since midnight. */
const clock = (minutes: number) =>
  `${String(Math.floor(minutes / 60) % 24).padStart(2, '0')}.${String(minutes % 60).padStart(2, '0')}`;

/**
 * The busiest 10-minute slot on the Thai clock, from finish times. The earliest wins
 * a tie. Null when no slot has PEAK_MIN, since "the busiest time" of three people is
 * not a fact worth posting.
 */
export function peakSlot(finishedAt: string[]): Recap['peak'] {
  const counts = new Map<number, number>();
  for (const iso of finishedAt) {
    const t = new Date(Date.parse(iso) + BANGKOK);
    const slot = Math.floor((t.getUTCHours() * 60 + t.getUTCMinutes()) / SLOT_MIN) * SLOT_MIN;
    counts.set(slot, (counts.get(slot) ?? 0) + 1);
  }
  let best: [number, number] | null = null;
  for (const [slot, n] of [...counts.entries()].sort(([a], [b]) => a - b)) {
    if (!best || n > best[1]) best = [slot, n];
  }
  if (!best || best[1] < PEAK_MIN) return null;
  return { from: clock(best[0]), to: clock(best[0] + SLOT_MIN), count: best[1] };
}

/**
 * The honest question's answers as whole tenths, or null with fewer than
 * RECAP_OKAY_MIN. Each is rounded on its own, so the three may not add to exactly 10;
 * the card shows them separately, never as a total.
 */
export function okayTenths(counts: { real: number; hide: number; depends: number }): Recap['okay'] {
  const answered = counts.real + counts.hide + counts.depends;
  if (answered < RECAP_OKAY_MIN) return null;
  const tenth = (n: number) => Math.round((n / answered) * 10);
  return { answered, hide: tenth(counts.hide), depends: tenth(counts.depends), real: tenth(counts.real) };
}

/** Thailand days with a finished booth session for this festival. */
async function boothDays(festival: FestivalId): Promise<string[]> {
  const c = await db();
  const r = await c.execute({
    sql: `SELECT completed_at FROM session WHERE mode = 'booth' AND festival = ? AND completed_at IS NOT NULL`,
    args: [festival],
  });
  return [...new Set(r.rows.map((row) => thaiDay(String(row.completed_at))))].sort();
}

async function nextBooth(festival: FestivalId, after: string): Promise<Recap['next']> {
  for (const id of festivalOrder) {
    if (id === festival) continue;
    const e = await getEvent(id);
    if (e.start > after) return { name: festivals[id].name, date: formatDateRange(e.start, e.end) };
  }
  return null;
}

function shape(
  base: Omit<Recap, 'flowers' | 'questions' | 'okay' | 'dateLabel' | 'next'>,
  flowerCounts: Map<string, number>,
  questions: RecapQuestion[],
  okayCounts: { real: number; hide: number; depends: number },
): Omit<Recap, 'dateLabel' | 'next'> {
  const total = [...flowerCounts.values()].reduce((s, n) => s + n, 0);
  const flowers = loykrathongFlowers
    .map((f) => {
      const count = flowerCounts.get(f.id) ?? 0;
      return { id: f.id, name: f.name, tint: f.tint, count, pct: total ? Math.round((count / total) * 100) : 0 };
    })
    .sort((a, b) => b.count - a.count);
  return { ...base, flowers, questions, okay: okayTenths(okayCounts) };
}

/** The recap for one Thailand day, or (day null) for every day of the booth. */
export async function getRecap(festival: FestivalId, day: string | null): Promise<Recap> {
  const days = await boothDays(festival);
  const f = { mode: 'booth' as const, status: 'done' as const, festival, ...(day ? { from: day, to: day } : {}) };
  const data = await getAdminData(f);

  const c = await db();
  const r = await c.execute({
    sql: `SELECT completed_at FROM session WHERE mode = 'booth' AND festival = ? AND completed_at IS NOT NULL`,
    args: [festival],
  });
  const finished = r.rows.map((row) => String(row.completed_at)).filter((iso) => !day || thaiDay(iso) === day);

  const stat = (id: string) => data.boothQuestions.find((q) => q.id === id);
  const questions = loykrathongQuiz.map((q) => {
    const s = stat(q.id);
    return { id: q.id, headline: q.headline, answered: s?.answered ?? 0, choices: s?.choices ?? [] };
  });
  const ok = stat(okayQuestion.id)?.choices ?? [];
  const okCount = (id: string) => ok.find((ch) => ch.id === id)?.count ?? 0;

  const shaped = shape(
    {
      festival,
      festivalName: festivals[festival].name,
      day,
      days,
      players: data.summary.completed,
      medianSeconds: data.summary.medianSeconds,
      peak: peakSlot(finished),
      sample: false,
    },
    new Map(data.flowers.map((fl) => [fl.id, fl.count])),
    questions,
    { real: okCount('real'), hide: okCount('hide'), depends: okCount('depends') },
  );

  const event = await getEvent(festival);
  const dateLabel = day ? formatDateRange(day, day) : formatDateRange(event.start, event.end);
  return { ...shaped, dateLabel, next: await nextBooth(festival, day ?? event.end) };
}

/** Invented numbers, so the cards can be designed before the booth. Never in production. */
export async function demoRecap(festival: FestivalId): Promise<Recap> {
  const flowerCounts = new Map(loykrathongFlowers.map((f, i) => [f.id, [31, 26, 22, 19, 14, 9][i] ?? 0]));
  const players = [...flowerCounts.values()].reduce((s, n) => s + n, 0);
  const split = (shares: number[]) => (q: (typeof loykrathongQuiz)[number]): RecapQuestion => {
    const choices = q.choices.map((ch, i) => {
      const count = Math.round((players * (shares[i] ?? 0)) / 100);
      return { id: ch.id, label: ch.label, count, pct: shares[i] ?? 0 };
    });
    return { id: q.id, headline: q.headline, answered: players, choices };
  };
  // Energy, weight, then the nine topics.
  const shares = [[38, 45, 17], [24, 49, 27], [34, 14, 12, 8, 10, 9, 6, 4, 3]];
  const event = await getEvent(festival);
  const shaped = shape(
    {
      festival,
      festivalName: festivals[festival].name,
      day: event.start,
      days: [event.start],
      players,
      medianSeconds: 74,
      peak: { from: '12.10', to: '12.20', count: 23 },
      sample: true,
    },
    flowerCounts,
    loykrathongQuiz.map((q, i) => split(shares[i])(q)),
    { real: 42, hide: 46, depends: 33 },
  );
  return {
    ...shaped,
    dateLabel: formatDateRange(event.start, event.start),
    next: await nextBooth(festival, event.end),
  };
}
