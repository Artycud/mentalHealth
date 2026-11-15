'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

import { BackButton } from '@/components/heart/BackButton';
import { LiveHeart } from '@/components/heart/LiveHeart';
import palette from '@/components/heart/palette.module.css';
import { feelings } from '@/content/th/heart';
import { vent } from '@/content/th/vent';
import { haptic } from '@/lib/haptics';
import { moodColour, rgb } from '@/lib/heart';
import { BACK } from '@/lib/nav';
import { clearHandOff, peekHandOff } from '@/lib/vent/handoff';
import type { VentMessage, VentResponse } from '@/lib/vent/types';

import { DriftingHints, Plane, Starters, TimeAsk } from './Invite';
import styles from './Vent.module.css';

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

  // Words already written on the home's VENT bar (lib/vent/handoff): the
  // conversation opens with them, sent, and the heart already listening.
  const [opening] = useState<Item | undefined>(() => {
    const text = peekHandOff();
    return text ? { id: nextId++, kind: 'me', text } : undefined;
  });
  const [items, setItems] = useState<Item[]>(() => (opening ? [opening] : []));
  const [draft, setDraft] = useState('');
  const [waiting, setWaiting] = useState(Boolean(opening));
  // One colour for the whole conversation, with a reason: the heart the check-up
  // gave them, or the week's pink. It never shifts on its own.
  const colour = feel ? rgb(moodColour(startAt[0], startAt[1])) : 'rgb(255 143 181)';
  const [ended, setEnded] = useState(false);
  /** "จบการคุย" was tapped once: ask before wiping everything. */
  const [confirming, setConfirming] = useState(false);

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

  /** Ask the server about the conversation so far. Never throws. */
  const fetchAnswer = async (list: Item[]): Promise<VentResponse> => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20_000);
    try {
      const res = await fetch('/api/vent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history(list).slice(-20), feel }),
        signal: controller.signal,
      });
      if (res.ok) return (await res.json()) as VentResponse;
    } catch {
      // Offline, or too slow: said plainly below, and the words stay on screen.
    } finally {
      clearTimeout(timer);
    }
    return { kind: 'unavailable' };
  };

  /** Put the answer on the page. */
  const show = (answer: VentResponse) => {
    setWaiting(false);
    if (answer.kind === 'reply') {
      setItems((l) => [...l, { id: nextId++, kind: 'ai', heard: answer.heard, lines: answer.lines, concern: answer.concern, mock: answer.mock }]);
    } else if (answer.kind === 'care') {
      setItems((l) => [...l, { id: nextId++, kind: 'care' }]);
    } else {
      setItems((l) => [...l, { id: nextId++, kind: 'problem', text: answer.kind === 'busy' ? vent.busy : vent.unavailable }]);
    }
  };

  const ask = (list: Item[]) => {
    setWaiting(true);
    void fetchAnswer(list).then(show);
  };

  // The words from the home go out as soon as the page opens, once.
  const opened = useRef(false);
  useEffect(() => {
    if (!opening || opened.current) return;
    opened.current = true;
    clearHandOff();
    void fetchAnswer([opening]).then(show);
    // fetchAnswer and show only read state through setters; run once, on arrival.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opening]);

  const sendText = (raw: string) => {
    const text = raw.trim();
    if (!text || waiting || capped) return;
    const list: Item[] = [...items.filter((i) => i.kind !== 'problem'), { id: nextId++, kind: 'me', text }];
    setItems(list);
    setDraft('');
    setConfirming(false);
    haptic('done');
    ask(list);
  };
  const send = () => sendText(draft);

  const retry = () => {
    const list = items.filter((i) => i.kind !== 'problem');
    setItems(list);
    ask(list);
  };

  const finish = () => {
    setConfirming(false);
    setItems([]);
    setDraft('');
    setEnded(true);
  };

  const restart = () => {
    setEnded(false);
  };

  if (ended) {
    return (
      <div className={styles.root}>
        <div className={styles.endedWrap}>
          <LiveHeart energy={0.5} weight={0.15} colour={colour} className={styles.floatAway} />
          <h1 className={styles.title}>{vent.ended.title}</h1>
          <p className={styles.body}>{vent.ended.body}</p>
          <div className={styles.endedActions}>
            <button type="button" className={`${palette.primary} ${styles.primary}`} data-press onClick={restart}>
              {vent.ended.again}
            </button>
            <Link href="/" transitionTypes={BACK} className={styles.textBtn} data-press>
              {vent.ended.home}
            </Link>
            <Link href={careHref} className={`${palette.pill} ${styles.careLink}`} data-press>
              {vent.ended.care}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.root} data-talking={talking}>

      <header className={styles.bar}>
        <BackButton href="/" />
        {talking &&
          (confirming ? (
            <span className={styles.confirm} role="group" aria-label={vent.endConfirm.ask}>
              <span className={styles.confirmAsk}>{vent.endConfirm.ask}</span>
              <button type="button" className={styles.confirmNo} data-press onClick={() => setConfirming(false)}>
                {vent.endConfirm.no}
              </button>
              <button type="button" className={styles.endBtn} data-press onClick={finish}>
                {vent.endConfirm.yes}
              </button>
            </span>
          ) : (
            <button type="button" className={styles.endBtn} data-press onClick={() => setConfirming(true)}>
              {vent.end}
            </button>
          ))}
      </header>

      <div className={styles.heartWrap}>
        <LiveHeart energy={startAt[0]} weight={startAt[1]} colour={colour} listening={waiting} className={styles.heart} />
      </div>

      <div className={styles.thread} aria-live="polite">
        {!talking && (
          <section className={styles.intro}>
            <p className={styles.note}>{start ? vent.intro.noteFromCheckup(start.word) : vent.intro.note}</p>
            {/* The heart asks first, something that fits the hour. */}
            <h1 className={styles.title}>
              <TimeAsk />
            </h1>
            <p className={styles.body}>{vent.intro.body}</p>
            <p className={styles.privacy}>{vent.intro.privacy}</p>

            <p className={styles.samplesLabel}>{vent.invite.orTap}</p>
            <div className={styles.samples}>
              <Starters onPick={sendText} disabled={waiting} />
            </div>
          </section>
        )}

        {items.map((item) =>
          item.kind === 'me' ? (
            <figure key={item.id} className={styles.me}>
              <figcaption className={styles.meNote}>{vent.wrote}</figcaption>
              <blockquote className={styles.meText}>{item.text}</blockquote>
            </figure>
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
                <Link href={careHref} className={`${palette.primary} ${styles.carePrimary}`} data-press>
                  {vent.care.cudCare}
                </Link>
                <a href={`tel:${vent.care.hotline.tel}`} className={`${palette.card} ${styles.careTel}`} data-press>
                  <b>{vent.care.hotline.label}</b>
                  <span>{vent.care.hotline.detail}</span>
                </a>
                <a href={`tel:${vent.care.emergency.tel}`} className={`${palette.card} ${styles.careTel}`} data-press>
                  <b>{vent.care.emergency.label}</b>
                </a>
              </div>
              <p className={styles.careStay}>{vent.care.stay}</p>
            </section>
          ) : (
            <div key={item.id} className={styles.problem}>
              <p>{item.text}</p>
              <button type="button" className={styles.textBtn} data-press onClick={retry}>
                {vent.retry}
              </button>
            </div>
          ),
        )}

        {/* Where the answer is about to land: the heart is thinking. */}
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

        {/* After an answer: a few things to say next, one tap to send. */}
        {!waiting && !capped && items.at(-1)?.kind === 'ai' && (
          <div className={styles.quick}>
            {vent.quick.map((q) => (
              <button key={q} type="button" className={styles.quickBtn} data-press onClick={() => sendText(q)}>
                {q}
              </button>
            ))}
          </div>
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
        <span className={styles.field}>
          <textarea
            ref={inputRef}
            className={styles.input}
            value={draft}
            rows={1}
            maxLength={vent.composer.max}
            placeholder=" "
            aria-label={vent.intro.title}
            disabled={capped}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              // On a computer Enter sends and Shift+Enter is a new line; on a phone
              // Enter is a new line and the round button sends, as in phone chats.
              if (e.key !== 'Enter' || e.shiftKey || e.nativeEvent.isComposing) return;
              const computer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
              if (computer || e.ctrlKey || e.metaKey) {
                e.preventDefault();
                send();
              }
            }}
          />
          <DriftingHints />
        </span>
        <button
          type="submit"
          className={styles.send}
          data-press
          disabled={!draft.trim() || waiting || capped}
          aria-label={vent.composer.send}
        >
          <Plane />
        </button>
      </form>
    </div>
  );
}
