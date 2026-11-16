import { festivalOrder, festivals, loykrathongFlowers, loykrathongQuiz, okayQuestion } from '../content/th/booth.ts';

import { getAdminData, thaiDay } from './admin-data.ts';
import { db } from './db.ts';
import { getEvent } from './events.ts';
import { tallies } from './tally.ts';
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
/** The check-up's top topic is named only from this many check-ups that picked one. */
export const RECAP_TOPIC_MIN = 5;
/** ระบาย's numbers go on a card only from this many chats. */
export const RECAP_VENT_MIN = 3;
/** The feelings that weigh: a flower for these says the heart is carrying something. */
const HEAVY = new Set(['sad', 'worried', 'angry']);
/** The booth questions whose top answer the card quotes. */
const QUOTED = ['q1', 'q4'];

export interface RecapFlower {
  id: string;
  name: string;
  tint: Tint;
  count: number;
  /** Of finished booth sessions, 0–100. */
  pct: number;
}

/** A feeling, as the flower the booth gives it. */
export interface RecapFeeling {
  id: string;
  /** The council's word for it: "ความกังวล". */
  word: string;
  tint: Tint;
  count: number;
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
  /** The top three feelings (flowers anyone got), most first. */
  feelings: RecapFeeling[];
  /** The heart check-up's most picked topic, or null below RECAP_TOPIC_MIN. */
  topic: { name: string; pct: number; base: number } | null;
  /** ระบาย in the same days, or null below RECAP_VENT_MIN chats. */
  vent: { chats: number; replied: number; within3: number; medianMin: number | null } | null;
  /** Players whose flower is sadness, worry or anger, as whole tenths (0–10), or null with no players. */
  heavy: { tenths: number; count: number } | null;
  /** The top answer to the quoted booth questions (QUOTED), when anyone answered. */
  quotes: { id: string; label: string; pct: number }[];
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

/** The most picked topic from the check-up's counts (lib/tally.ts), or null below RECAP_TOPIC_MIN. */
export function topTopic(counts: Map<string, number>): Recap['topic'] {
  const base = counts.get('checkup:topics') ?? 0;
  if (base < RECAP_TOPIC_MIN) return null;
  let best: [string, number] | null = null;
  for (const [key, n] of counts) {
    if (!key.startsWith('topic:')) continue;
    if (!best || n > best[1]) best = [key.slice('topic:'.length), n];
  }
  return best ? { name: best[0], pct: Math.round((best[1] / base) * 100), base } : null;
}

/**
 * ระบาย's numbers: the larger of the day's counters (lib/tally.ts, which outlive
 * an ended chat but only began on 16 Nov 2026) and the chats still open (which
 * also say how fast they were first answered). Null below RECAP_VENT_MIN chats.
 */
export function ventCounts(counts: Map<string, number>, open: { replyMin: number | null }[] = []): Recap['vent'] {
  const answered = open.map((o) => o.replyMin).filter((m): m is number => m !== null).sort((a, b) => a - b);
  const chats = Math.max(counts.get('vent:chats') ?? 0, open.length);
  if (chats < RECAP_VENT_MIN) return null;
  const replied = Math.max(counts.get('vent:replied') ?? 0, answered.length);
  const within3 = Math.max(counts.get('vent:within3') ?? 0, answered.filter((m) => m <= 3).length);
  const medianMin = answered.length >= 3 ? Math.round(answered[Math.floor((answered.length - 1) / 2)]) : null;
  return { chats, replied, within3, medianMin };
}

/** The ระบาย chats still open that started on these Thailand days, with minutes to their first answer. */
async function openChats(days: string[]): Promise<{ replyMin: number | null }[]> {
  if (days.length === 0) return [];
  const c = await db();
  const r = await c.execute({
    sql: `SELECT t.created_at,
            (SELECT MIN(m.created_at) FROM vent_message m WHERE m.thread_id = t.id AND m.sender = 'sapa') AS first
          FROM vent_thread t
          WHERE date(t.created_at, '+7 hours') IN (${days.map(() => '?').join(', ')})`,
    args: days,
  });
  return r.rows.map((row) => ({
    replyMin: row.first ? Math.max(0, (Date.parse(String(row.first)) - Date.parse(String(row.created_at))) / 60_000) : null,
  }));
}

/** Every day from `from` to `to`, inclusive. */
function daysFrom(from: string, to: string): string[] {
  const out: string[] = [];
  for (let t = Date.parse(`${from}T00:00:00Z`); t <= Date.parse(`${to}T00:00:00Z`) && out.length < 400; t += 86_400_000) {
    out.push(new Date(t).toISOString().slice(0, 10));
  }
  return out;
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
  base: Omit<Recap, 'flowers' | 'feelings' | 'questions' | 'okay' | 'dateLabel' | 'next' | 'heavy' | 'quotes'>,
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
  const feelings = flowers
    .filter((f) => f.count > 0)
    .slice(0, 3)
    .map((f) => ({ id: f.id, word: loykrathongFlowers.find((x) => x.id === f.id)!.emotionWord, tint: f.tint, count: f.count, pct: f.pct }));
  const heavyCount = loykrathongFlowers.filter((f) => HEAVY.has(f.emotion)).reduce((n, f) => n + (flowerCounts.get(f.id) ?? 0), 0);
  const heavy = total ? { tenths: Math.round((heavyCount / total) * 10), count: heavyCount } : null;
  const quotes = QUOTED.flatMap((id) => {
    const q = questions.find((x) => x.id === id);
    if (!q || q.answered === 0) return [];
    const top = [...q.choices].sort((a, b) => b.count - a.count)[0];
    return [{ id, label: top.label, pct: top.pct }];
  });
  return { ...base, flowers, feelings, questions, okay: okayTenths(okayCounts), heavy, quotes };
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
      topic: null,
      vent: null,
      sample: false,
    },
    new Map(data.flowers.map((fl) => [fl.id, fl.count])),
    questions,
    { real: okCount('real'), hide: okCount('hide'), depends: okCount('depends') },
  );

  const event = await getEvent(festival);
  const dateLabel = day ? formatDateRange(day, day) : formatDateRange(event.start, event.end);
  // The check-up and ระบาย are not the booth's: counted over the same days.
  const span = day ? [day] : daysFrom(event.start, event.end);
  const counts = await tallies(span, '');
  return { ...shaped, topic: topTopic(counts), vent: ventCounts(counts, await openChats(span)), dateLabel, next: await nextBooth(festival, day ?? event.end) };
}

/** Invented numbers, so the cards can be designed before the booth. Never in production. */
export async function demoRecap(festival: FestivalId): Promise<Recap> {
  // Shaped like the council's guess: most are worried, and school is on their minds.
  const counts: Record<string, number> = { lavender: 38, sunflower: 27, hydrangea: 21, 'pink-tulip': 17, gerbera: 12, 'red-rose': 9 };
  const flowerCounts = new Map(loykrathongFlowers.map((f) => [f.id, counts[f.id] ?? 0]));
  const players = [...flowerCounts.values()].reduce((s, n) => s + n, 0);
  const split = (shares: number[]) => (q: (typeof loykrathongQuiz)[number]): RecapQuestion => {
    const choices = q.choices.map((ch, i) => {
      const count = Math.round((players * (shares[i] ?? 0)) / 100);
      return { id: ch.id, label: ch.label, count, pct: shares[i] ?? 0 };
    });
    return { id: q.id, headline: q.headline, answered: players, choices };
  };
  // The five questions, six answers each, in the council's order.
  const shares = [
    [22, 18, 9, 17, 21, 13],
    [8, 20, 14, 19, 24, 15],
    [26, 7, 16, 18, 15, 18],
    [6, 19, 21, 17, 22, 15],
    [20, 9, 17, 16, 23, 15],
  ];
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
      topic: { name: 'เรื่องเรียน', pct: 62, base: 84 },
      vent: { chats: 23, replied: 21, within3: 15, medianMin: 2 },
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
