'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

import { feelings } from '@/content/th/heart';
import { sapa } from '@/content/th/sapa';

import styles from './sapa.module.css';

type Item = {
  ref: string;
  urgent: boolean;
  waiting: boolean;
  feel: string | null;
  updatedAt: string;
  count: number;
  last: { sender: 'student' | 'sapa'; body: string } | null;
};
type Thread = Omit<Item, 'count' | 'last'> & { messages: { id: number; sender: 'student' | 'sapa'; body: string; at: string }[] };

const LIST_MS = 6000;
const THREAD_MS = 4000;

const time = (iso: string) =>
  new Date(iso).toLocaleString('th-TH', { timeZone: 'Asia/Bangkok', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
const feelWord = (feel: string | null) => {
  if (!feel) return null;
  const [r, c] = feel.split('-').map(Number);
  return feelings[r]?.[c]?.word ?? null;
};

/** A short, soft two-note chime, made on the spot (no sound file). */
function chime() {
  try {
    const ctx = new AudioContext();
    [660, 880].forEach((f, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, ctx.currentTime + i * 0.18);
      g.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + i * 0.18 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + i * 0.18 + 0.4);
      o.connect(g).connect(ctx.destination);
      o.start(ctx.currentTime + i * 0.18);
      o.stop(ctx.currentTime + i * 0.18 + 0.45);
    });
  } catch {
    // No sound on this device: the list still shows it.
  }
}

/**
 * The พี่สภา inbox. The list (urgent first, then waiting for an answer) refreshes
 * every few seconds; a new conversation needing an answer plays a chime and, if
 * allowed, a browser notification (without the student's words). On a phone the
 * list and the conversation take turns on the screen.
 */
export function SapaInbox({ initial }: { initial: string | null }) {
  const router = useRouter();
  const [items, setItems] = useState<Item[] | null>(null);
  const [open, setOpen] = useState<string | null>(initial);
  const [thread, setThread] = useState<Thread | null | 'gone'>(null);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [notifyOn, setNotifyOn] = useState(false);
  const seenWaiting = useRef<Set<string> | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  // ---- the list ----
  const loadList = useCallback(async () => {
    try {
      const res = await fetch('/api/sapa/threads', { cache: 'no-store' });
      if (res.status === 401) return router.replace('/sapa/login');
      if (!res.ok) return;
      const { threads } = (await res.json()) as { threads: Item[] };
      // Something newly waiting for an answer: chime, and notify if allowed.
      const waitingNow = new Set(threads.filter((t) => t.waiting).map((t) => `${t.ref}:${t.count}`));
      if (seenWaiting.current && [...waitingNow].some((k) => !seenWaiting.current!.has(k))) {
        chime();
        if (typeof Notification !== 'undefined' && Notification.permission === 'granted' && document.hidden) {
          new Notification(sapa.title, { body: sapa.inbox.newMessage, tag: 'sapa' });
        }
      }
      seenWaiting.current = waitingNow;
      setItems(threads);
    } catch {
      // Offline for a moment: the next look catches up.
    }
  }, [router]);

  useEffect(() => {
    const first = setTimeout(() => void loadList(), 0);
    const timer = setInterval(() => void loadList(), LIST_MS);
    const granted = setTimeout(() => setNotifyOn(typeof Notification !== 'undefined' && Notification.permission === 'granted'), 0);
    return () => {
      clearTimeout(first);
      clearTimeout(granted);
      clearInterval(timer);
    };
  }, [loadList]);

  // ---- one conversation ----
  const loadThread = useCallback(async (ref: string) => {
    try {
      const res = await fetch(`/api/sapa/threads/${ref}`, { cache: 'no-store' });
      if (res.status === 404) return setThread('gone');
      if (!res.ok) return;
      setThread((await res.json()) as Thread);
    } catch {
      // Next look.
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    const first = setTimeout(() => {
      setThread(null);
      void loadThread(open);
    }, 0);
    const timer = setInterval(() => void loadThread(open), THREAD_MS);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, [open, loadThread]);

  const messageCount = thread && thread !== 'gone' ? thread.messages.length : 0;
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [messageCount]);

  const choose = (ref: string | null) => {
    setOpen(ref);
    setDraft('');
    setError('');
    window.history.replaceState(null, '', ref ? `/sapa?t=${ref}` : '/sapa');
  };

  const send = async () => {
    const text = draft.trim();
    if (!open || !text || sending) return;
    setSending(true);
    setError('');
    try {
      const res = await fetch(`/api/sapa/threads/${open}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (res.status === 404) setThread('gone');
      else if (!res.ok) throw new Error();
      else {
        setDraft('');
        void loadThread(open);
        void loadList();
      }
    } catch {
      setError(sapa.inbox.failed);
    } finally {
      setSending(false);
    }
  };

  const askNotify = async () => {
    if (typeof Notification === 'undefined') return;
    setNotifyOn((await Notification.requestPermission()) === 'granted');
  };

  const logout = async () => {
    await fetch('/api/sapa/logout', { method: 'POST' });
    router.replace('/sapa/login');
  };

  return (
    <main className={styles.page} data-open={open ? 'true' : undefined}>
      <header className={styles.top}>
        <h1>{sapa.title}</h1>
        <div className={styles.tools}>
          <button type="button" className={styles.quiet} onClick={() => void askNotify()} disabled={notifyOn}>
            {notifyOn ? sapa.inbox.notifyOn : sapa.inbox.notify}
          </button>
          <button type="button" className={styles.quiet} onClick={() => void logout()}>
            {sapa.inbox.logout}
          </button>
        </div>
      </header>

      <div className={styles.panes}>
        <nav className={styles.list} aria-label={sapa.title}>
          {items?.length === 0 && <p className={styles.empty}>{sapa.inbox.empty}</p>}
          {items?.map((t) => (
            <button
              key={t.ref}
              type="button"
              className={styles.item}
              data-current={t.ref === open ? 'true' : undefined}
              data-urgent={t.urgent ? 'true' : undefined}
              onClick={() => choose(t.ref)}
            >
              <span className={styles.itemHead}>
                {t.urgent && <b className={styles.tagUrgent}>{sapa.inbox.urgent}</b>}
                <span className={t.waiting ? styles.tagWaiting : styles.tagDone}>{t.waiting ? sapa.inbox.waiting : sapa.inbox.answered}</span>
                <span className={styles.when}>{time(t.updatedAt)}</span>
              </span>
              <span className={styles.preview}>
                {t.last?.sender === 'sapa' ? `${sapa.inbox.you}: ` : ''}
                {t.last?.body}
              </span>
              <span className={styles.meta}>
                {sapa.inbox.count(t.count)}
                {feelWord(t.feel) ? ` · ${sapa.inbox.feel(feelWord(t.feel)!)}` : ''}
              </span>
            </button>
          ))}
        </nav>

        <section className={styles.thread}>
          {!open && <p className={styles.empty}>{sapa.inbox.open}</p>}
          {open && (
            <>
              <button type="button" className={`${styles.quiet} ${styles.back}`} onClick={() => choose(null)}>
                ← {sapa.inbox.back}
              </button>
              {thread === 'gone' && <p className={styles.empty}>{sapa.inbox.gone}</p>}
              {thread && thread !== 'gone' && (
                <>
                  {thread.urgent && <p className={styles.urgentNote}>⚠️ {sapa.guide[2]}</p>}
                  <ol className={styles.messages}>
                    {thread.messages.map((m) => (
                      <li key={m.id} className={styles.msg} data-sender={m.sender}>
                        <span className={styles.who}>
                          {m.sender === 'student' ? sapa.inbox.student : sapa.inbox.you} · {time(m.at)}
                        </span>
                        <p>{m.body}</p>
                      </li>
                    ))}
                  </ol>
                  <div ref={endRef} />
                  <form
                    className={styles.reply}
                    onSubmit={(e) => {
                      e.preventDefault();
                      void send();
                    }}
                  >
                    <textarea
                      className={styles.input}
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      placeholder={sapa.inbox.placeholder}
                      maxLength={1200}
                      rows={3}
                    />
                    <div className={styles.replyFoot}>
                      <ul className={styles.guide}>
                        {sapa.guide.map((g) => (
                          <li key={g}>{g}</li>
                        ))}
                      </ul>
                      <button type="submit" className={styles.sendBtn} disabled={!draft.trim() || sending}>
                        {sending ? sapa.inbox.sending : sapa.inbox.send}
                      </button>
                    </div>
                    {error && <p className={styles.error}>{error}</p>}
                  </form>
                </>
              )}
            </>
          )}
        </section>
      </div>
    </main>
  );
}
