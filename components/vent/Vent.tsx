'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';

import { BackButton } from '@/components/heart/BackButton';
import { LiveHeart } from '@/components/heart/LiveHeart';
import palette from '@/components/heart/palette.module.css';
import { feelings } from '@/content/th/heart';
import { vent } from '@/content/th/vent';
import { haptic } from '@/lib/haptics';
import { moodColour, rgb } from '@/lib/heart';
import { BACK } from '@/lib/nav';
import { clearHandOff, peekHandOff } from '@/lib/vent/handoff';

import { DriftingHints, Plane, Starters, TimeAsk } from './Invite';
import styles from './Vent.module.css';

type Msg = { id: number; sender: 'student' | 'sapa'; body: string; pending?: boolean };
type Chat = { key: string; code: string };

/* ---- the student's chat, remembered on this phone (localStorage) ----
   Only their own key and code: the words live on the server until they end it.
   A store React can read without a flash, and that other tabs keep in step. */
const STORE = 'cud-vent-chat';
const listeners = new Set<() => void>();
const subscribe = (fn: () => void) => {
  listeners.add(fn);
  window.addEventListener('storage', fn);
  return () => {
    listeners.delete(fn);
    window.removeEventListener('storage', fn);
  };
};
const readRaw = () => {
  try {
    return localStorage.getItem(STORE);
  } catch {
    return null;
  }
};
function saveChat(chat: Chat | null) {
  try {
    if (chat) localStorage.setItem(STORE, JSON.stringify(chat));
    else localStorage.removeItem(STORE);
  } catch {
    // Storage blocked (private mode): the chat code on screen is the way back.
  }
  listeners.forEach((fn) => fn());
}
const parseChat = (raw: string | null): Chat | null => {
  try {
    const c = raw ? (JSON.parse(raw) as Chat) : null;
    return c?.key && c.code ? c : null;
  } catch {
    return null;
  }
};

/** How often an open chat looks for a พี่'s answer. */
const POLL_MS = 5000;

/**
 * ระบายให้พี่ๆ สภาฟัง. The student writes; a พี่ from the council answers when they
 * can (app/sapa, or Discord). Not a chat app: the heart at the top listens, the
 * student's words are kept as a quoted note, and the answer arrives on the sky.
 *
 * This phone remembers the conversation (its key, in localStorage), so closing the
 * page or reloading loses nothing; the chat code opens it from anywhere else.
 * "จบการคุย" deletes all of it on the server.
 */
export function Vent({ feel, careHref }: { feel?: string; careHref: string }) {
  const [row, col] = feel ? feel.split('-').map(Number) : [];
  const start = feel ? feelings[row][col] : undefined;
  const startAt: [number, number] = feel ? [(col + 0.5) / 3, (row + 0.5) / 3] : [0.45, 0.35];
  // One colour for the whole conversation: the heart the check-up gave them, or the week's pink.
  const colour = feel ? rgb(moodColour(startAt[0], startAt[1])) : 'rgb(255 143 181)';

  const chat = parseChat(useSyncExternalStore(subscribe, readRaw, () => null));
  const [messages, setMessages] = useState<Msg[]>([]);
  const [waiting, setWaiting] = useState(false);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [care, setCare] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [ended, setEnded] = useState(false);
  const [askingCode, setAskingCode] = useState(false);
  const [copied, setCopied] = useState(false);

  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const lastId = useRef(0);
  const talking = messages.length > 0;

  // Keep the newest thing in view.
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    endRef.current?.scrollIntoView({ block: 'end', behavior: reduce ? 'auto' : 'smooth' });
  }, [messages.length, waiting]);

  // The box grows with what is written, up to a few lines.
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 150)}px`;
  }, [draft]);

  /** New messages since the last one we have; forgets a conversation that is gone. */
  const pull = useCallback(async (c: Chat, fresh = false) => {
    try {
      const res = await fetch(`/api/vent/${c.key}?after=${fresh ? 0 : lastId.current}`, { cache: 'no-store' });
      if (res.status === 404) {
        saveChat(null);
        setMessages([]);
        setWaiting(false);
        lastId.current = 0;
        setNotice(vent.gone);
        return;
      }
      if (!res.ok) return;
      const data = (await res.json()) as { waiting: boolean; messages: Msg[] };
      setWaiting(data.waiting);
      if (fresh) {
        setMessages(data.messages);
      } else if (data.messages.length) {
        setMessages((list) => [...list.filter((m) => !m.pending), ...data.messages.filter((m) => !list.some((x) => x.id === m.id))]);
        if (data.messages.some((m) => m.sender === 'sapa')) haptic('done');
      }
      const newest = data.messages.at(-1);
      if (newest) lastId.current = Math.max(lastId.current, newest.id);
    } catch {
      // Offline for a moment: the next look will catch up.
    }
  }, []);

  // Open this phone's conversation, and keep looking for answers while the page is shown.
  const chatKey = chat?.key;
  useEffect(() => {
    if (!chatKey || !chat) return;
    lastId.current = 0;
    const first = setTimeout(() => void pull(chat, true), 0);
    const look = () => {
      if (!document.hidden) void pull(chat);
    };
    const timer = setInterval(look, POLL_MS);
    document.addEventListener('visibilitychange', look);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
      document.removeEventListener('visibilitychange', look);
    };
    // `chat` is rebuilt from storage each render; its key is what matters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatKey, pull]);

  /** Sends a message: starts the conversation if there is none yet. */
  const sendText = useCallback(
    async (raw: string) => {
      const text = raw.trim().slice(0, vent.composer.max);
      if (!text || sending) return;
      setSending(true);
      setNotice(null);
      setConfirming(false);
      const temp: Msg = { id: -Date.now(), sender: 'student', body: text, pending: true };
      setMessages((list) => [...list, temp]);
      setDraft('');
      haptic('done');
      try {
        const post = (url: string, body: object) =>
          fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        const startNew = () => post('/api/vent', { text, feel });
        let current = parseChat(readRaw());
        let res = current ? await post(`/api/vent/${current.key}`, { text }) : await startNew();
        if (res.status === 404 && current) {
          // Their old chat ended somewhere else: start a fresh one with these words.
          saveChat(null);
          current = null;
          setMessages((list) => list.filter((m) => m.id === temp.id));
          res = await startNew();
        }
        if (!res.ok) throw new Error(res.status === 429 ? 'busy' : res.status === 409 ? 'full' : 'failed');
        const data = (await res.json()) as { key?: string; code?: string; care?: boolean };
        if (data.care) setCare(true);
        setWaiting(true);
        if (data.key && data.code) saveChat({ key: data.key, code: data.code });
        else if (current) void pull(current);
      } catch (error) {
        const why = error instanceof Error ? error.message : 'failed';
        setMessages((list) => list.filter((m) => m.id !== temp.id));
        setDraft(text);
        setNotice(why === 'busy' ? vent.busy : why === 'full' ? vent.full : vent.failed);
      } finally {
        setSending(false);
      }
    },
    [feel, pull, sending],
  );
  const send = () => void sendText(draft);

  // Words already written on the home's VENT bar (lib/vent/handoff): sent on arrival, once.
  const opened = useRef(false);
  useEffect(() => {
    if (opened.current) return;
    opened.current = true;
    const words = peekHandOff();
    if (!words) return;
    clearHandOff();
    // After this render, so it lands in the conversation this phone already has, if any.
    const t = setTimeout(() => void sendText(words), 0);
    return () => clearTimeout(t);
  }, [sendText]);

  const finish = async () => {
    const current = chat;
    setConfirming(false);
    saveChat(null);
    setMessages([]);
    setWaiting(false);
    setCare(false);
    lastId.current = 0;
    setEnded(true);
    if (current) {
      try {
        await fetch(`/api/vent/${current.key}`, { method: 'DELETE' });
      } catch {
        // Unreachable now: it is deleted after 30 quiet days anyway.
      }
    }
  };

  const openCode = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const code = String(new FormData(e.currentTarget).get('code') ?? '');
    try {
      const res = await fetch('/api/vent/code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as Chat;
      setAskingCode(false);
      setNotice(null);
      saveChat({ key: data.key, code: data.code });
    } catch {
      setNotice(vent.code.notFound);
    }
  };

  const copyCode = async () => {
    if (!chat) return;
    try {
      await navigator.clipboard.writeText(chat.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // No clipboard: the code is on screen to write down.
    }
  };

  if (ended) {
    return (
      <div className={styles.root}>
        <div className={styles.endedWrap}>
          <LiveHeart energy={0.5} weight={0.15} colour={colour} className={styles.floatAway} />
          <h1 className={styles.title}>{vent.ended.title}</h1>
          <p className={styles.body}>{vent.ended.body}</p>
          <div className={styles.endedActions}>
            <button type="button" className={`${palette.primary} ${styles.primary}`} data-press onClick={() => setEnded(false)}>
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

  const lastIsStudent = messages.at(-1)?.sender === 'student';

  return (
    <div className={styles.root} data-talking={talking} data-replied={messages.some((m) => m.sender === 'sapa')}>
      <header className={styles.bar}>
        <BackButton href="/" />
        {chat &&
          (confirming ? (
            <span className={styles.confirm} role="group" aria-label={vent.endConfirm.ask}>
              <span className={styles.confirmAsk}>{vent.endConfirm.ask}</span>
              <button type="button" className={styles.confirmNo} data-press onClick={() => setConfirming(false)}>
                {vent.endConfirm.no}
              </button>
              <button type="button" className={styles.endBtn} data-press onClick={() => void finish()}>
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
        {!talking && !chat && (
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
              <Starters onPick={(s) => void sendText(s)} disabled={sending} />
            </div>

            {askingCode ? (
              <form className={styles.codeForm} onSubmit={(e) => void openCode(e)}>
                <input
                  name="code"
                  className={styles.codeInput}
                  placeholder="XXXX-XXXX"
                  aria-label={vent.code.ask}
                  autoComplete="off"
                  autoCapitalize="characters"
                  maxLength={12}
                />
                <button type="submit" className={styles.endBtn} data-press>
                  {vent.code.open}
                </button>
                <button type="button" className={styles.confirmNo} data-press onClick={() => setAskingCode(false)}>
                  {vent.code.cancel}
                </button>
              </form>
            ) : (
              <button type="button" className={styles.textBtn} data-press onClick={() => setAskingCode(true)}>
                {vent.intro.haveCode}
              </button>
            )}
          </section>
        )}

        {/* The chat code: the way back in from another phone. */}
        {chat && (
          <div className={styles.codeTag}>
            <span>
              {vent.code.label} <b>{chat.code}</b>
            </span>
            <button type="button" className={styles.confirmNo} data-press onClick={() => void copyCode()}>
              {copied ? vent.code.copied : vent.code.copy}
            </button>
            <small>{vent.code.hint}</small>
          </div>
        )}

        {messages.map((m) =>
          m.sender === 'student' ? (
            <figure key={m.id} className={styles.me} data-pending={m.pending ? 'true' : undefined}>
              <figcaption className={styles.meNote}>{vent.me}</figcaption>
              <blockquote className={styles.meText}>{m.body}</blockquote>
            </figure>
          ) : (
            <div key={m.id} className={styles.ai}>
              <p className={styles.heardNote}>{vent.sapa}</p>
              <p className={styles.line}>{m.body}</p>
            </div>
          ),
        )}

        {/* Sent, and waiting for a พี่. */}
        {chat && waiting && lastIsStudent && !sending && (
          <div className={styles.waiting} role="status">
            <p className={styles.listening}>✓ {vent.sent}</p>
            <p className={styles.waitingNote}>{vent.waitingNote}</p>
          </div>
        )}

        {care && (
          <section className={styles.care}>
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
        )}

        {notice && <p className={styles.problem}>{notice}</p>}
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
            aria-label={vent.intro.note}
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
        <button type="submit" className={styles.send} data-press disabled={!draft.trim() || sending} aria-label={vent.composer.send}>
          <Plane />
        </button>
      </form>
    </div>
  );
}
