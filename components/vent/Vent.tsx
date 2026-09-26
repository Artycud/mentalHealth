'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

import { LiveHeart } from '@/components/heart/LiveHeart';
import { feelings, heart } from '@/content/th/heart';
import { vent } from '@/content/th/vent';
import type { Feeling, VentMessage, VentResponse } from '@/lib/vent/types';

import styles from './Vent.module.css';

/** Where each feeling the AI notices sits on the check-up's heart (energy, weight). */
const FEELING_AT: Record<Feeling, [number, number]> = {
  light: [0.6, 0.12],
  okay: [0.5, 0.35],
  tired: [0.15, 0.68],
  heavy: [0.35, 0.88],
  tense: [0.85, 0.8],
  mixed: [0.5, 0.55],
};

type Item =
  | { id: number; kind: 'me'; text: string }
  | { id: number; kind: 'ai'; heard?: string; lines: string[]; concern?: boolean; mock?: boolean }
  | { id: number; kind: 'care' }
  | { id: number; kind: 'problem'; text: string };

let nextId = 1;

/**
 * ระบาย. A conversation, but not a chat app: the heart at the top listens while
 * the AI thinks, every answer opens with the student's own words that it heard,
 * and the answer arrives a line at a time on the sky rather than in a bubble.
 *
 * Nothing is kept. The conversation lives in this component's state only: no
 * storage, no cookies, and it is gone when the page closes or "จบการคุย" is pressed.
 */
export function Vent({ feel, careHref }: { feel?: string; careHref: string }) {
  const [row, col] = feel ? feel.split('-').map(Number) : [];
  const start = feel ? feelings[row][col] : undefined;
  const startAt: [number, number] = feel ? [(col + 0.5) / 3, (row + 0.5) / 3] : [0.45, 0.35];

  const [items, setItems] = useState<Item[]>([]);
  const [draft, setDraft] = useState('');
  const [waiting, setWaiting] = useState(false);
  const [mood, setMood] = useState<[number, number]>(startAt);
  const [ended, setEnded] = useState(false);

  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const turns = items.filter((i) => i.kind === 'me').length;
  const capped = turns >= vent.maxTurns;
  const talking = items.length > 0;

  // Keep the newest thing in view.
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    endRef.current?.scrollIntoView({ block: 'end', behavior: reduce ? 'auto' : 'smooth' });
  }, [items, waiting]);

  // The box grows with what is written, up to a few lines.
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 150)}px`;
  }, [draft]);

  /** The conversation as the server needs it: what was said, not how it was shown. */
  const history = (list: Item[]): VentMessage[] =>
    list.flatMap((i): VentMessage[] =>
      i.kind === 'me' ? [{ role: 'user', text: i.text }] : i.kind === 'ai' ? [{ role: 'ai', text: i.lines.join(' ') }] : [],
    );

  const ask = async (list: Item[]) => {
    setWaiting(true);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20_000);
    let answer: VentResponse = { kind: 'unavailable' };
    try {
      const res = await fetch('/api/vent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history(list).slice(-20), feel }),
        signal: controller.signal,
      });
      if (res.ok) answer = (await res.json()) as VentResponse;
    } catch {
      // Offline, or too slow: said plainly below, and the words stay on screen.
    } finally {
      clearTimeout(timer);
      setWaiting(false);
    }

    if (answer.kind === 'reply') {
      if (answer.feeling) setMood(FEELING_AT[answer.feeling]);
      setItems((l) => [...l, { id: nextId++, kind: 'ai', heard: answer.heard, lines: answer.lines, concern: answer.concern, mock: answer.mock }]);
    } else if (answer.kind === 'care') {
      setMood(FEELING_AT.heavy);
      setItems((l) => [...l, { id: nextId++, kind: 'care' }]);
    } else {
      setItems((l) => [...l, { id: nextId++, kind: 'problem', text: answer.kind === 'busy' ? vent.busy : vent.unavailable }]);
    }
  };

  const send = () => {
    const text = draft.trim();
    if (!text || waiting || capped) return;
    const list: Item[] = [...items.filter((i) => i.kind !== 'problem'), { id: nextId++, kind: 'me', text }];
    setItems(list);
    setDraft('');
    void ask(list);
  };

  const retry = () => {
    const list = items.filter((i) => i.kind !== 'problem');
    setItems(list);
    void ask(list);
  };

  const finish = () => {
    setItems([]);
    setDraft('');
    setEnded(true);
  };

  const restart = () => {
    setEnded(false);
    setMood(startAt);
  };

  if (ended) {
    return (
      <div className={styles.root}>
        <div className={styles.sky} aria-hidden="true" />
        <div className={styles.endedWrap}>
          <LiveHeart energy={0.5} weight={0.15} className={styles.floatAway} />
          <h1 className={styles.title}>{vent.ended.title}</h1>
          <p className={styles.body}>{vent.ended.body}</p>
          <div className={styles.endedActions}>
            <button type="button" className={styles.primary} onClick={restart}>
              {vent.ended.again}
            </button>
            <Link href="/" className={styles.textBtn}>
              {vent.ended.home}
            </Link>
            <Link href={careHref} className={styles.careLink}>
              {vent.ended.care}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.root} data-talking={talking}>
      <div className={styles.sky} aria-hidden="true" />
      <div className={styles.grain} aria-hidden="true" />

      <header className={styles.bar}>
        <Link href="/" className={styles.textBtn}>
          {vent.back}
        </Link>
        {talking && (
          <button type="button" className={styles.endBtn} onClick={finish}>
            {vent.end}
          </button>
        )}
      </header>

      <div className={styles.heartWrap}>
        <LiveHeart energy={mood[0]} weight={mood[1]} listening={waiting} className={styles.heart} />
        {waiting && (
          <p className={styles.listening} role="status">
            {vent.listening}
            <span className={styles.dots} aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
          </p>
        )}
      </div>

      <div className={styles.thread} aria-live="polite">
        {!talking && (
          <section className={styles.intro}>
            <p className={styles.note}>{start ? vent.intro.noteFromCheckup(start.word) : vent.intro.note}</p>
            <h1 className={styles.title}>{vent.intro.title}</h1>
            <p className={styles.body}>{vent.intro.body}</p>
            <p className={styles.privacy}>{vent.intro.privacy}</p>

            <p className={styles.samplesLabel}>{vent.intro.samplesLabel}</p>
            <div className={styles.samples}>
              {heart.ways.vent.samples.map((s) => (
                <button
                  key={s}
                  type="button"
                  className={styles.sample}
                  onClick={() => {
                    setDraft(s.replace(/…$/, ''));
                    inputRef.current?.focus();
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </section>
        )}

        {items.map((item) =>
          item.kind === 'me' ? (
            <p key={item.id} className={styles.me}>
              {item.text}
            </p>
          ) : item.kind === 'ai' ? (
            <div key={item.id} className={styles.ai}>
              {item.heard && (
                <p className={styles.heard}>
                  <span className={styles.heardNote}>{vent.heard}</span>
                  <mark className={styles.mark}>“{item.heard}”</mark>
                </p>
              )}
              {item.lines.map((line, i) => (
                <p key={i} className={styles.line} style={{ '--i': i + (item.heard ? 1 : 0) } as React.CSSProperties}>
                  {line}
                </p>
              ))}
              {item.concern && (
                <p className={styles.concern} style={{ '--i': item.lines.length + 1 } as React.CSSProperties}>
                  {vent.concern.body} <Link href={careHref}>{vent.concern.link}</Link>
                </p>
              )}
              {item.mock && <p className={styles.mock}>{vent.mock}</p>}
            </div>
          ) : item.kind === 'care' ? (
            <section key={item.id} className={styles.care}>
              <p className={styles.careNote}>{vent.care.note}</p>
              <h2 className={styles.careTitle}>{vent.care.title}</h2>
              <p className={styles.careBody}>{vent.care.body}</p>
              <p className={styles.careHonest}>{vent.care.honest}</p>
              <div className={styles.careLinks}>
                <Link href={careHref} className={styles.carePrimary}>
                  {vent.care.cudCare}
                </Link>
                <a href={`tel:${vent.care.hotline.tel}`} className={styles.careTel}>
                  <b>{vent.care.hotline.label}</b>
                  <span>{vent.care.hotline.detail}</span>
                </a>
                <a href={`tel:${vent.care.emergency.tel}`} className={styles.careTel}>
                  <b>{vent.care.emergency.label}</b>
                </a>
              </div>
              <p className={styles.careStay}>{vent.care.stay}</p>
            </section>
          ) : (
            <div key={item.id} className={styles.problem}>
              <p>{item.text}</p>
              <button type="button" className={styles.textBtn} onClick={retry}>
                {vent.retry}
              </button>
            </div>
          ),
        )}

        {capped && <p className={styles.capped}>{vent.capped}</p>}
        <div ref={endRef} />
      </div>

      <form
        className={styles.composer}
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <textarea
          ref={inputRef}
          className={styles.input}
          value={draft}
          rows={1}
          maxLength={vent.composer.max}
          placeholder={vent.composer.placeholder}
          aria-label={vent.intro.title}
          disabled={capped}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            // Enter is a new line on a phone; Ctrl/⌘+Enter sends on a keyboard.
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
              e.preventDefault();
              send();
            }
          }}
        />
        <button type="submit" className={styles.send} disabled={!draft.trim() || waiting || capped} aria-label={vent.composer.send}>
          <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
            <path d="M11 18 L11 5 M5 10 L11 4 L17 10" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </form>
    </div>
  );
}
