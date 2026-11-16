'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';

import { feelings } from '@/content/th/heart';
import { phi, sapa } from '@/content/th/sapa';

import styles from './sapa.module.css';

type Msg = { id: number; sender: 'student' | 'sapa'; body: string; at: string; by: string | null };
type Item = {
  ref: string;
  urgent: boolean;
  waiting: boolean;
  feel: string | null;
  updatedAt: string;
  count: number;
  last: { sender: 'student' | 'sapa'; body: string; by: string | null } | null;
  claimedBy: string | null;
  waitingSince: string | null;
  studentTyping: boolean;
  sapaTyping: string | null;
};
type Thread = {
  ref: string;
  urgent: boolean;
  waiting: boolean;
  feel: string | null;
  messages: Msg[];
  claimedBy: string | null;
  studentTyping: boolean;
  sapaTyping: string | null;
};
type Member = { name: string; replies: number; claims: number };
type Tab = 'waiting' | 'answered' | 'mine';

const LIST_MS = 5000;
const THREAD_MS = 3000;
/** A typing mark goes out at most this often while typing (the server keeps it for 6 s). */
const TYPING_EVERY = 3000;

const time = (iso: string) => new Date(iso).toLocaleTimeString('th-TH', { timeZone: 'Asia/Bangkok', hour: '2-digit', minute: '2-digit' });
const feelWord = (feel: string | null) => {
  if (!feel) return null;
  const [r, c] = feel.split('-').map(Number);
  return feelings[r]?.[c]?.word ?? null;
};
/** A soft colour per name, so each พี่ is recognisable at a glance. */
const INKS = ['#FF8FB5', '#FFB511', '#7FB7E6', '#8ED1B5', '#C9A7EB', '#F59E7A'];
const inkFor = (name: string) => INKS[[...name].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7) % INKS.length];
const initial = (name: string) => [...name.replace(/^พี่/, '')][0] ?? 'พ';

/* ---- this device's nickname: a year-long cookie (read by the server, so the
   prompt never flashes) mirrored in localStorage (instant after a change) ---- */
const NAME_KEY = 'cud-sapa-name';
/** Keep the name in the server's cookie. Fails quietly: localStorage still has it. */
const remember = (name: string) =>
  fetch('/api/sapa/name', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) }).catch(() => {});
const nameListeners = new Set<() => void>();
const subscribeName = (fn: () => void) => {
  nameListeners.add(fn);
  window.addEventListener('storage', fn);
  return () => {
    nameListeners.delete(fn);
    window.removeEventListener('storage', fn);
  };
};
const readName = () => {
  try {
    return localStorage.getItem(NAME_KEY) ?? '';
  } catch {
    return '';
  }
};
function saveName(name: string) {
  try {
    if (name) localStorage.setItem(NAME_KEY, name);
    else localStorage.removeItem(NAME_KEY);
  } catch {
    // Storage blocked: the cookie still remembers it.
  }
  if (name) void remember(name);
  nameListeners.forEach((fn) => fn());
}

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

function Avatar({ name, size = 30 }: { name: string; size?: number }) {
  return (
    <span className={styles.avatar} style={{ background: inkFor(name), width: size, height: size, fontSize: size * 0.46 }} aria-hidden="true">
      {initial(name)}
    </span>
  );
}

function Dots() {
  return (
    <span className={styles.dots} aria-hidden="true">
      <i />
      <i />
      <i />
    </span>
  );
}

/** Asked once on this device: the nickname the team will see (students only see "พี่สภา"). */
function NameGate({ current, onDone }: { current: string; onDone: () => void }) {
  const [value, setValue] = useState(current);
  return (
    <div className={styles.gate} role="dialog" aria-modal="true" aria-labelledby="sapa-name-h">
      <form
        className={styles.gateCard}
        onSubmit={(e) => {
          e.preventDefault();
          const name = value.replace(/\s+/g, ' ').trim().slice(0, 24);
          if (!name) return;
          saveName(name);
          onDone();
        }}
      >
        <h2 id="sapa-name-h">{sapa.name.title}</h2>
        <p>{sapa.name.body}</p>
        <input
          className={styles.gateInput}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={sapa.name.placeholder}
          maxLength={24}
          autoFocus
          autoComplete="nickname"
        />
        {value.trim() && <p className={styles.gatePreview}>{sapa.name.you(value.trim())}</p>}
        <button type="submit" className={styles.sendBtn} disabled={!value.trim()}>
          {sapa.name.save}
        </button>
      </form>
    </div>
  );
}

/**
 * The พี่สภา dashboard. Each device names its พี่ once (a nickname only the team sees
 * on answers, claims and today's tally; students only ever see "พี่สภา"). The list is in tabs:
 * waiting for an answer, answered, and the chats you look after. A chat can be
 * claimed by one พี่, who is responsible for it; anyone can still answer.
 *
 * Both sides see the other typing: a mark is sent at most every 3 seconds while
 * typing, and read on the looks the page already makes (list 5 s, chat 3 s).
 * Something new waiting plays a chime and, if allowed, a browser notification
 * (without the student's words). On a phone the list and the chat take turns.
 */
export function SapaInbox({ initial: firstRef, name: saved }: { initial: string | null; name: string }) {
  const router = useRouter();
  const me = useSyncExternalStore(subscribeName, () => readName() || saved, () => saved);
  // Named before the cookie existed (localStorage only): copy it over, so it isn't asked again.
  useEffect(() => {
    const local = readName();
    if (local && local !== saved) void remember(local);
  }, [saved]);
  const [naming, setNaming] = useState(false);
  const [items, setItems] = useState<Item[] | null>(null);
  const [team, setTeam] = useState<Member[]>([]);
  const [now, setNow] = useState(0);
  const [tab, setTab] = useState<Tab>('waiting');
  const [open, setOpen] = useState<string | null>(firstRef);
  const [thread, setThread] = useState<Thread | null | 'gone'>(null);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [notifyOn, setNotifyOn] = useState(false);
  const seenWaiting = useRef<Set<string> | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const lastTyping = useRef(0);

  // ---- the list ----
  const loadList = useCallback(async () => {
    try {
      const res = await fetch('/api/sapa/threads', { cache: 'no-store' });
      if (res.status === 401) return router.replace('/sapa/login');
      if (!res.ok) return;
      const data = (await res.json()) as { threads: Item[]; team: Member[] };
      const waitingNow = new Set(data.threads.filter((t) => t.waiting).map((t) => `${t.ref}:${t.count}`));
      if (seenWaiting.current && [...waitingNow].some((k) => !seenWaiting.current!.has(k))) {
        chime();
        if (typeof Notification !== 'undefined' && Notification.permission === 'granted' && document.hidden) {
          new Notification(sapa.title, { body: sapa.inbox.newMessage, tag: 'sapa' });
        }
      }
      seenWaiting.current = waitingNow;
      setItems(data.threads);
      setTeam(data.team);
      setNow(Date.now());
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

  const current = thread && thread !== 'gone' ? thread : null;
  const messageCount = current?.messages.length ?? 0;
  const studentTyping = !!current?.studentTyping;
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [messageCount, studentTyping]);

  const choose = (ref: string | null) => {
    setOpen(ref);
    setDraft('');
    setError('');
    window.history.replaceState(null, '', ref ? `/sapa?t=${ref}` : '/sapa');
  };

  const post = (url: string, body: object) =>
    fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

  /** `at` is the event's own time stamp: a typing mark goes out at most every 3 s. */
  const typed = (text: string, at: number) => {
    setDraft(text);
    if (!open || !me || !text.trim()) return;
    const t = at;
    if (lastTyping.current && t - lastTyping.current < TYPING_EVERY) return;
    lastTyping.current = t;
    void post(`/api/sapa/threads/${open}/typing`, { by: me }).catch(() => {});
  };

  const send = async () => {
    const text = draft.trim();
    if (!open || !text || sending) return;
    setSending(true);
    setError('');
    try {
      const res = await post(`/api/sapa/threads/${open}`, { text, by: me });
      if (res.status === 404) setThread('gone');
      else if (!res.ok) throw new Error();
      else {
        setDraft('');
        lastTyping.current = 0;
        void loadThread(open);
        void loadList();
      }
    } catch {
      setError(sapa.inbox.failed);
    } finally {
      setSending(false);
    }
  };

  const claim = async (release = false) => {
    if (!open || !me) return;
    if (!release && current?.claimedBy && current.claimedBy !== me && !window.confirm(sapa.inbox.takeOverAsk(current.claimedBy))) return;
    await post(`/api/sapa/threads/${open}/claim`, { by: me, release }).catch(() => {});
    void loadThread(open);
    void loadList();
  };

  const askNotify = async () => {
    if (typeof Notification === 'undefined') return;
    setNotifyOn((await Notification.requestPermission()) === 'granted');
  };

  const logout = async () => {
    await fetch('/api/sapa/logout', { method: 'POST' });
    router.replace('/sapa/login');
  };

  const waitingList = items?.filter((t) => t.waiting) ?? [];
  const answeredList = items?.filter((t) => !t.waiting) ?? [];
  const mineList = items?.filter((t) => t.claimedBy === me) ?? [];
  const shown = tab === 'waiting' ? waitingList : tab === 'answered' ? answeredList : mineList;
  const minutes = (iso: string | null) => (iso && now ? Math.max(0, Math.floor((now - Date.parse(iso)) / 60_000)) : 0);

  return (
    <main className={styles.page} data-open={open ? 'true' : undefined}>
      {(!me || naming) && <NameGate current={me} onDone={() => setNaming(false)} />}

      <header className={styles.top}>
        <div className={styles.brand}>
          <h1>{sapa.title}</h1>
          {items && <span className={styles.stats}>{sapa.inbox.stats(waitingList.length, answeredList.length)}</span>}
        </div>
        <div className={styles.tools}>
          {me && (
            <button type="button" className={styles.meChip} onClick={() => setNaming(true)} title={sapa.name.change}>
              <Avatar name={me} size={26} />
              {phi(me)}
            </button>
          )}
          <button type="button" className={styles.quiet} onClick={() => void askNotify()} disabled={notifyOn}>
            {notifyOn ? sapa.inbox.notifyOn : sapa.inbox.notify}
          </button>
          <button type="button" className={styles.quiet} onClick={() => void logout()}>
            {sapa.inbox.logout}
          </button>
        </div>
      </header>

      {team.length > 0 && (
        <div className={styles.team} aria-label={sapa.inbox.today}>
          <span className={styles.teamLabel}>{sapa.inbox.today}</span>
          {team.map((m) => (
            <span key={m.name} className={styles.teamChip}>
              <Avatar name={m.name} size={22} />
              {phi(m.name)} <b>{sapa.inbox.replies(m.replies)}</b>
            </span>
          ))}
        </div>
      )}

      <div className={styles.panes}>
        <nav className={styles.list} aria-label={sapa.title}>
          <div className={styles.tabs} role="tablist">
            {(
              [
                ['waiting', waitingList.length],
                ['answered', answeredList.length],
                ['mine', mineList.length],
              ] as [Tab, number][]
            ).map(([id, n]) => (
              <button key={id} type="button" role="tab" aria-selected={tab === id} className={styles.tab} onClick={() => setTab(id)}>
                {sapa.inbox.tabs[id]}
                <span className={styles.tabCount} data-hot={id === 'waiting' && n > 0 ? 'true' : undefined}>
                  {n}
                </span>
              </button>
            ))}
          </div>

          {items?.length === 0 && <p className={styles.empty}>{sapa.inbox.empty}</p>}
          {items && items.length > 0 && shown.length === 0 && <p className={styles.empty}>{sapa.inbox.emptyTab}</p>}
          {shown.map((t) => {
            const waited = minutes(t.waitingSince);
            return (
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
                  {t.waiting ? (
                    <span className={styles.tagWaiting} data-late={waited >= 30 ? 'true' : waited >= 3 ? 'warm' : undefined}>
                      {sapa.inbox.waited(waited)}
                    </span>
                  ) : (
                    <span className={styles.tagDone}>{sapa.inbox.answered}</span>
                  )}
                  <span className={styles.when}>{time(t.updatedAt)}</span>
                </span>
                <span className={styles.preview}>
                  {t.studentTyping ? (
                    <span className={styles.typingLine}>
                      {sapa.inbox.typingStudent}
                      <Dots />
                    </span>
                  ) : (
                    <>
                      {t.last?.sender === 'sapa' ? `${t.last.by ? phi(t.last.by) : sapa.inbox.team}: ` : ''}
                      {t.last?.body}
                    </>
                  )}
                </span>
                <span className={styles.meta}>
                  {t.claimedBy ? (
                    <span className={styles.owner} data-mine={t.claimedBy === me ? 'true' : undefined}>
                      <Avatar name={t.claimedBy} size={18} />
                      {t.claimedBy === me ? sapa.inbox.mine : sapa.inbox.claimedBy(t.claimedBy)}
                    </span>
                  ) : (
                    <span className={styles.ownerNone}>{sapa.inbox.unclaimed}</span>
                  )}
                  {t.sapaTyping && t.sapaTyping !== me && <span className={styles.typingSmall}>{sapa.inbox.typingSapa(t.sapaTyping)}…</span>}
                  <span>{sapa.inbox.count(t.count)}</span>
                </span>
              </button>
            );
          })}
        </nav>

        <section className={styles.thread}>
          {!open && <p className={styles.empty}>{sapa.inbox.open}</p>}
          {open && (
            <>
              <div className={styles.threadHead}>
                <button type="button" className={`${styles.quiet} ${styles.back}`} onClick={() => choose(null)}>
                  ← {sapa.inbox.back}
                </button>
                {current && (
                  <>
                    <span className={styles.threadInfo}>
                      {current.urgent && <b className={styles.tagUrgent}>{sapa.inbox.urgent}</b>}
                      {feelWord(current.feel) && <span className={styles.feel}>{sapa.inbox.feel(feelWord(current.feel)!)}</span>}
                    </span>
                    <span className={styles.claimBox}>
                      {current.claimedBy && (
                        <span className={styles.owner} data-mine={current.claimedBy === me ? 'true' : undefined}>
                          <Avatar name={current.claimedBy} size={22} />
                          {current.claimedBy === me ? sapa.inbox.mine : sapa.inbox.claimedBy(current.claimedBy)}
                        </span>
                      )}
                      {current.claimedBy === me ? (
                        <button type="button" className={styles.quiet} onClick={() => void claim(true)}>
                          {sapa.inbox.release}
                        </button>
                      ) : (
                        <button type="button" className={styles.claimBtn} onClick={() => void claim()}>
                          {current.claimedBy ? sapa.inbox.takeOver(current.claimedBy) : sapa.inbox.claim}
                        </button>
                      )}
                    </span>
                  </>
                )}
              </div>

              {thread === 'gone' && <p className={styles.empty}>{sapa.inbox.gone}</p>}
              {current && (
                <>
                  {current.urgent && <p className={styles.urgentNote}>⚠️ {sapa.guide[2]}</p>}
                  <ol className={styles.messages}>
                    {current.messages.map((m) => {
                      const mine = m.sender === 'sapa' && m.by === me;
                      return (
                        <li key={m.id} className={styles.msg} data-sender={m.sender}>
                          {m.sender === 'sapa' && <Avatar name={m.by ?? 'พี่สภา'} size={28} />}
                          <div className={styles.bubbleWrap}>
                            <span className={styles.who}>
                              {m.sender === 'student' ? sapa.inbox.student : mine ? sapa.inbox.you : m.by ? phi(m.by) : sapa.inbox.team} · {time(m.at)}
                            </span>
                            <p className={styles.bubble}>{m.body}</p>
                          </div>
                        </li>
                      );
                    })}
                    {current.studentTyping && (
                      <li className={styles.msg} data-sender="student">
                        <div className={styles.bubbleWrap}>
                          <span className={styles.who}>{sapa.inbox.typingStudent}</span>
                          <p className={`${styles.bubble} ${styles.typingBubble}`}>
                            <Dots />
                          </p>
                        </div>
                      </li>
                    )}
                  </ol>
                  {current.sapaTyping && current.sapaTyping !== me && (
                    <p className={styles.otherTyping}>
                      <Avatar name={current.sapaTyping} size={18} />
                      {sapa.inbox.typingSapa(current.sapaTyping)}
                      <Dots />
                    </p>
                  )}
                  <div ref={endRef} />

                  <form
                    className={styles.reply}
                    onSubmit={(e) => {
                      e.preventDefault();
                      void send();
                    }}
                  >
                    <div className={styles.quick}>
                      {sapa.quick.map((q) => (
                        <button key={q} type="button" className={styles.quickBtn} onClick={(e) => typed(draft.trim() ? `${draft.trim()} ${q}` : q, e.timeStamp)}>
                          {q}
                        </button>
                      ))}
                    </div>
                    <textarea
                      className={styles.input}
                      value={draft}
                      onChange={(e) => typed(e.target.value, e.timeStamp)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                          e.preventDefault();
                          void send();
                        }
                      }}
                      placeholder={sapa.inbox.placeholder}
                      maxLength={1200}
                      rows={3}
                    />
                    <div className={styles.replyFoot}>
                      <details className={styles.guide}>
                        <summary>{sapa.inbox.guideTitle}</summary>
                        <ul>
                          {sapa.guide.map((g) => (
                            <li key={g}>{g}</li>
                          ))}
                        </ul>
                      </details>
                      <button type="submit" className={styles.sendBtn} disabled={!draft.trim() || sending || !me}>
                        {sending ? sapa.inbox.sending : me ? `${sapa.inbox.send} · ${phi(me)}` : sapa.inbox.send}
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
