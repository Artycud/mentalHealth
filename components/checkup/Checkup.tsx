'use client';

import Link from 'next/link';
import { ViewTransition, useEffect, useRef, useState } from 'react';

import { BackButton } from '@/components/heart/BackButton';
import { HeartGlyph } from '@/components/heart/HeartGlyph';
import palette from '@/components/heart/palette.module.css';
import { useInView } from '@/components/heart/useInView';
import { checkup } from '@/content/th/checkup';
import { feelings, forRow, type WayId } from '@/content/th/heart';
import { prefersReducedMotion, subscribe } from '@/lib/frame';
import { haptic } from '@/lib/haptics';
import { blobPath, cell, moodColour, rgb } from '@/lib/heart';
import { BACK as BACK_TYPES, FORWARD } from '@/lib/nav';

import styles from './Checkup.module.css';

type Step = 'meet' | 'energy' | 'weight' | 'whole' | 'topics' | 'result';

const ORDER: Step[] = ['meet', 'energy', 'weight', 'whole', 'topics', 'result'];
const PREV: Record<Exclude<Step, 'meet'>, Step> = { energy: 'meet', weight: 'energy', whole: 'weight', topics: 'whole', result: 'topics' };
const NEXT: Partial<Record<Step, Step>> = { meet: 'energy', energy: 'weight', weight: 'whole', whole: 'topics', topics: 'result' };

const HREF: Record<WayId, string> = { self: '/me', vent: '/vent', checkin: '/checkin' };
const NEUTRAL: [number, number, number] = [214, 204, 220];
const TOPIC_INKS = ['#6FD7B8', '#FFC94D', '#9BAAFF', '#FF9A85', '#F0588A', '#8FD0FF', '#C9B8D8', '#FFB3CB'];

/** Which third of 0 → 1 a value is in. */
const third = (v: number) => (v < 0.34 ? 0 : v < 0.67 ? 1 : 2);

/**
 * The guided check-up (/checkup). One persistent heart; the words and the
 * controls around it change step by step. The heart's size, wobble and colour
 * are written straight to the DOM from one animation loop, so React only
 * re-renders when a step or an answer changes.
 *
 * Moving through it keeps the student oriented: the heart stays where it is
 * while the words slide (in from the right going on, from the left going back),
 * a sideways swipe on the words does the same as the buttons, and each step,
 * each notch while dragging, and the result land as a tiny haptic tap.
 */
export function Checkup({ careHref, start = 'meet' }: { careHref: string; start?: 'meet' | 'energy' }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);

  // From the home's heart the student has already said yes: straight to question 1.
  const [step, setStep] = useState<Step>(start);
  const [dir, setDir] = useState<'forward' | 'back'>('forward');
  const [energy, setEnergy] = useState<number | null>(null);
  const [weight, setWeight] = useState<number | null>(null);
  const [topics, setTopics] = useState<string[]>([]);

  // Everything the loop reads, mirrored into refs.
  const live = useRef({
    step: 'meet' as Step,
    energy: 0.3,
    weight: 0.4,
    dragging: false,
    angle: 0,
    /** Whether the current question has been answered at all yet. */
    touched: false,
  });
  useEffect(() => {
    live.current.step = step;
  }, [step]);
  useEffect(() => {
    if (energy !== null) live.current.energy = energy;
    live.current.touched = energy !== null;
  }, [energy]);
  useEffect(() => {
    if (weight !== null) live.current.weight = weight;
  }, [weight]);

  // The result is taller than a screen: start reading it from its top.
  useEffect(() => {
    if (step !== 'result' || !frameRef.current) return;
    const top = frameRef.current.getBoundingClientRect().top + window.scrollY;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top, behavior: reduce ? 'auto' : 'smooth' });
  }, [step]);

  // ---- the heart: on the shared frame loop, only while it is on screen ----
  const stageInView = useInView(stageRef, '0px');
  const motion = useRef({ scale: 0.14, reveal: 0, pull: 0, t0: 0, colour: '' });
  useEffect(() => {
    if (!stageInView) return;
    const reduce = prefersReducedMotion();
    const m = motion.current;
    if (!m.t0) m.t0 = performance.now();

    const frame = (now: number, dt: number, skip: boolean) => {
      const s = live.current;
      const t = reduce ? 0 : (now - m.t0) / 1000;
      // The heart grows in on arrival, and steps back for the result.
      // It also answers the question being asked: fuller with more charge.
      const target = s.step === 'result' ? 0.78 : s.step === 'energy' && s.touched ? 0.8 + s.energy * 0.32 : 1;
      m.scale += (target - m.scale) * Math.min(1, dt * 2.2);

      // The colour only arrives once both questions are answered.
      const revealed = s.step === 'whole' || s.step === 'topics' || s.step === 'result';
      m.reveal += ((revealed ? 1 : 0) - m.reveal) * Math.min(1, dt * 1.4);
      const mood = moodColour(s.energy, s.weight);
      const c = rgb([0, 1, 2].map((i) => NEUTRAL[i] + (mood[i] - NEUTRAL[i]) * m.reveal) as never);
      // Only touch the style when the colour really changed: each change
      // restyles the words that use it.
      if (c !== m.colour) {
        m.colour = c;
        rootRef.current?.style.setProperty('--c', c);
      }

      m.pull += ((s.dragging ? 1 : 0) - m.pull) * 0.12;
      if (skip) return;
      const quiet = s.step === 'meet';
      pathRef.current?.setAttribute(
        'd',
        blobPath({
          energy: quiet ? 0.12 : s.energy,
          weight: quiet ? 0.35 : s.step === 'energy' ? 0.35 : s.weight,
          t,
          scale: m.scale,
          pullAngle: s.angle,
          pull: m.pull,
        }),
      );
    };

    if (reduce) {
      // Still, but it must still show each answer: redraw on a slow beat.
      const timer = setInterval(() => frame(performance.now(), 1, false), 150);
      frame(performance.now(), 1, false);
      return () => clearInterval(timer);
    }
    return subscribe((now, info) => frame(now, info.dt, info.skip));
  }, [stageInView]);

  /** Go to a step, sliding the words the right way, with a small tap. */
  const goTo = (next: Step) => {
    setDir(ORDER.indexOf(next) < ORDER.indexOf(step) ? 'back' : 'forward');
    setStep(next);
    haptic(next === 'result' ? 'done' : 'step');
  };
  const back = () => {
    if (step !== 'meet') goTo(PREV[step]);
  };

  /** A notch every tenth while dragging: you can feel the answer move. */
  const notch = useRef(-1);
  const feelNotch = (v: number) => {
    const n = Math.round(v * 10);
    if (notch.current !== -1 && n !== notch.current) haptic('tap');
    notch.current = n;
  };

  // ---- dragging, constrained to the question being asked ----
  // A finger moves more often than the screen draws: the heart follows every
  // move at once (through `live`), and React hears about it once a frame.
  const pending = useRef<{ energy?: number; weight?: number }>({});
  const commit = useRef(0);
  const answer = (next: { energy?: number; weight?: number }) => {
    if (next.energy !== undefined) {
      live.current.energy = next.energy;
      live.current.touched = true;
    }
    if (next.weight !== undefined) live.current.weight = next.weight;
    Object.assign(pending.current, next);
    if (commit.current) return;
    commit.current = requestAnimationFrame(() => {
      commit.current = 0;
      const p = pending.current;
      pending.current = {};
      if (p.energy !== undefined) setEnergy(p.energy);
      if (p.weight !== undefined) setWeight(p.weight);
    });
  };
  useEffect(() => () => cancelAnimationFrame(commit.current), []);

  const read = (e: React.PointerEvent) => {
    const r = stageRef.current!.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    const y = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
    live.current.angle = Math.atan2(y - 0.5, x - 0.5);
    if (step === 'energy') {
      live.current.angle = x < 0.5 ? Math.PI : 0;
      feelNotch(x);
      answer({ energy: x });
    } else if (step === 'weight') {
      live.current.angle = y < 0.5 ? -Math.PI / 2 : Math.PI / 2;
      feelNotch(y);
      answer({ weight: y });
    } else if (step === 'whole') {
      answer({ energy: x, weight: y });
    }
  };
  const draggable = step === 'energy' || step === 'weight' || step === 'whole';
  const down = (e: React.PointerEvent) => {
    if (!draggable) return;
    stageRef.current?.setPointerCapture(e.pointerId);
    live.current.dragging = true;
    read(e);
  };
  const up = () => {
    live.current.dragging = false;
    notch.current = -1;
  };

  // ---- swiping the words: left goes on (when it can), right goes back ----
  const canGoOn =
    step === 'meet' || step === 'whole' || step === 'topics' || (step === 'energy' && energy !== null) || (step === 'weight' && weight !== null);
  const swipe = useRef<{ x: number; y: number; id: number } | null>(null);
  const swipeStart = (e: React.PointerEvent) => {
    if (step === 'result' || stageRef.current?.contains(e.target as Node)) return;
    swipe.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
  };
  const swipeEnd = (e: React.PointerEvent) => {
    const sw = swipe.current;
    swipe.current = null;
    if (!sw || sw.id !== e.pointerId) return;
    const dx = e.clientX - sw.x;
    const dy = e.clientY - sw.y;
    if (Math.abs(dx) < 60 || Math.abs(dy) > Math.abs(dx) * 0.6) return;
    if (dx > 0) {
      if (step === 'meet' || (step === 'energy' && start === 'energy')) return;
      back();
    } else if (canGoOn && NEXT[step]) goTo(NEXT[step]!);
  };

  // Keyboard: arrows answer the current question too.
  const key = (e: React.KeyboardEvent) => {
    const d = 0.1;
    const dx = e.key === 'ArrowRight' ? d : e.key === 'ArrowLeft' ? -d : 0;
    const dy = e.key === 'ArrowDown' ? d : e.key === 'ArrowUp' ? -d : 0;
    if (!dx && !dy) return;
    e.preventDefault();
    const clamp = (v: number) => Math.min(1, Math.max(0, v));
    if ((step === 'energy' || step === 'whole') && dx) setEnergy(clamp((energy ?? 0.5) + dx));
    if ((step === 'weight' || step === 'whole') && dy) setWeight(clamp((weight ?? 0.5) + dy));
  };

  const where = cell(energy ?? 0.5, weight ?? 0.5);
  const feeling = feelings[where.row][where.col];
  const row = where.row;
  const toggleTopic = (t: string) => setTopics((ts) => (ts.includes(t) ? ts.filter((x) => x !== t) : [...ts, t]));

  // VENT starts from this heart, so the conversation can begin where the check-up ended.
  const ventHref = `/vent?feel=${where.row}-${where.col}`;

  const restart = () => {
    setEnergy(null);
    setWeight(null);
    setTopics([]);
    live.current.energy = 0.3;
    live.current.weight = 0.4;
    setDir('back');
    setStep(start);
  };

  return (
    <div ref={rootRef} className={styles.root} data-step={step} data-dir={dir}>
      <div>
        <div
          ref={frameRef}
          className={styles.frame}
          onPointerDown={swipeStart}
          onPointerUp={swipeEnd}
          onPointerCancel={() => {
            swipe.current = null;
          }}
        >
          {/* ---- words above the heart ---- */}
          {/* Back steps through the questions; from the first it leaves. */}
          <div className={styles.bar}>
            {step === 'meet' || (step === 'energy' && start === 'energy') ? (
              <BackButton href="/" />
            ) : (
              <BackButton onBack={back} />
            )}
          </div>

          <div className={styles.top} key={`top-${step}`}>
            {step === 'meet' && (
              <>
                <p className={styles.note}>{checkup.meet.note}</p>
                <h1 className={styles.title}>{checkup.meet.title}</h1>
                <p className={styles.body}>{checkup.meet.body}</p>
              </>
            )}
            {step === 'energy' && (
              <>
                <p className={styles.note}>{checkup.energy.note}</p>
                <h2 className={styles.title}>{checkup.energy.title}</h2>
              </>
            )}
            {step === 'weight' && (
              <>
                <p className={styles.note}>{checkup.weight.note}</p>
                <h2 className={styles.title}>{checkup.weight.title}</h2>
              </>
            )}
            {step === 'whole' && (
              <>
                <p className={styles.note}>{checkup.whole.note}</p>
                <h2 className={styles.bigWord}>{feeling.word}</h2>
                <p className={styles.body}>{feeling.line}</p>
              </>
            )}
            {step === 'topics' && (
              <>
                <p className={styles.note}>
                  {checkup.topics.note} &quot;{feeling.word}&quot;
                </p>
                <h2 className={styles.title}>{checkup.topics.title}</h2>
                <p className={styles.body}>{checkup.topics.body}</p>
              </>
            )}
            {step === 'result' && (
              <>
                <p className={styles.note}>{checkup.result.note}</p>
                <h2 className={styles.bigWord}>{feeling.word}</h2>
                <p className={styles.body}>{checkup.result.lines[row]}</p>
              </>
            )}
          </div>

          {/* ---- the heart ---- */}
          <div
            ref={stageRef}
            className={styles.stage}
            data-drag={draggable}
            onPointerDown={down}
            onPointerMove={(e) => live.current.dragging && read(e)}
            onPointerUp={up}
            onPointerCancel={up}
            onKeyDown={key}
            tabIndex={draggable ? 0 : -1}
            role={draggable ? 'slider' : undefined}
            aria-label={draggable ? (step === 'energy' ? checkup.energy.title : step === 'weight' ? checkup.weight.title : feeling.word) : undefined}
            aria-valuemin={draggable ? 0 : undefined}
            aria-valuemax={draggable ? 100 : undefined}
            aria-valuenow={draggable ? Math.round(((step === 'weight' ? weight : energy) ?? 0.5) * 100) : undefined}
          >
            <div className={styles.glow} aria-hidden="true" />
            <div className={styles.glass} aria-hidden="true" />

            {step === 'energy' && (
              <div className={styles.hTrack} aria-hidden="true">
                <span>{checkup.energy.ends.low}</span>
                <span>{checkup.energy.ends.high}</span>
                <i data-ghost={energy === null} style={{ left: `${(energy ?? 0.5) * 100}%` }} />
              </div>
            )}
            {step === 'weight' && (
              <div className={styles.vTrack} aria-hidden="true">
                <span>{checkup.weight.ends.light}</span>
                <span>{checkup.weight.ends.heavy}</span>
                <i data-ghost={weight === null} style={{ top: `${(weight ?? 0.5) * 100}%` }} />
              </div>
            )}
            {step === 'whole' && <div className={styles.rings} aria-hidden="true" />}

            {/* The same heart as the home's card: it flies in from there. */}
            <ViewTransition name="checkup-heart" share="heart-morph" default="none">
              <div className={styles.blobBox}>
                <HeartGlyph pathRef={pathRef} className={styles.blob} />
              </div>
            </ViewTransition>

            {/* What's on their mind circles the heart. */}
            {(step === 'topics' || step === 'result') && topics.length > 0 && (
              <div className={styles.orbit} aria-hidden="true">
                {topics.map((t, i) => (
                  <span
                    key={t}
                    className={styles.moon}
                    style={{
                      transform: `rotate(${(360 / topics.length) * i}deg) translateX(var(--orbit)) rotate(${-(360 / topics.length) * i}deg)`,
                      background: TOPIC_INKS[checkup.topics.options.indexOf(t as never) % TOPIC_INKS.length],
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* ---- words and controls below the heart ---- */}
          <div className={styles.bottom} key={`bottom-${step}`}>
            {step === 'meet' && (
              <button type="button" className={`${palette.primary} ${styles.primary}`} data-press onClick={() => goTo('energy')}>
                {checkup.meet.go}
              </button>
            )}

            {step === 'energy' && (
              <>
                <div className={styles.meter}>
                  <Battery level={energy} />
                  <p className={styles.anchor}>{energy === null ? checkup.energy.hint : checkup.energy.anchors[third(energy)]}</p>
                </div>
                <button
                  type="button"
                  className={`${palette.primary} ${styles.primary}`}
                  data-press
                  data-off={energy === null}
                  onClick={() => energy !== null && goTo('weight')}
                >
                  {checkup.energy.go}
                </button>
              </>
            )}

            {step === 'weight' && (
              <>
                <div className={styles.meter}>
                  <Bag level={weight} />
                  <p className={styles.anchor}>{weight === null ? checkup.weight.hint : checkup.weight.anchors[third(weight)]}</p>
                </div>
                <button
                  type="button"
                  className={`${palette.primary} ${styles.primary}`}
                  data-press
                  data-off={weight === null}
                  onClick={() => weight !== null && goTo('whole')}
                >
                  {checkup.weight.go}
                </button>
              </>
            )}

            {step === 'whole' && (
              <>
                <p className={styles.sub}>{checkup.whole.body}</p>
                <button type="button" className={`${palette.primary} ${styles.primary}`} data-press onClick={() => goTo('topics')}>
                  {checkup.whole.go}
                </button>
              </>
            )}

            {step === 'topics' && (
              <>
                <div className={styles.chips}>
                  {checkup.topics.options.map((t) => (
                    <button
                      key={t}
                      type="button"
                      className={styles.chip}
                      data-press
                      aria-pressed={topics.includes(t)}
                      onClick={() => toggleTopic(t)}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                <button type="button" className={`${palette.primary} ${styles.primary}`} data-press onClick={() => goTo('result')}>
                  {topics.length ? checkup.topics.go : checkup.topics.none}
                </button>
              </>
            )}

            {step === 'result' && (
              <div className={styles.result}>
                {/* The dots around the heart, named. */}
                {topics.length > 0 && (
                  <ul className={styles.legend} aria-label={checkup.result.topicsLabel}>
                    {topics.map((t) => (
                      <li key={t}>
                        <i style={{ background: TOPIC_INKS[checkup.topics.options.indexOf(t as never) % TOPIC_INKS.length] }} />
                        {t}
                      </li>
                    ))}
                  </ul>
                )}

                {/* Where the heart landed, on the map everyone moves around. */}
                <div className={styles.map}>
                  <div className={styles.mapText}>
                    <p className={styles.mapTitle}>{checkup.result.map.title}</p>
                    <p className={styles.mapBody}>{checkup.result.map.body}</p>
                  </div>
                  {/* The words sit around the colour, never on it; the dot stays inside it. */}
                  <div className={styles.mapFrame} aria-hidden="true">
                    <span className={styles.mapLight}>{checkup.result.map.light}</span>
                    <span className={styles.mapLow}>{checkup.result.map.low}</span>
                    <div className={styles.mapField}>
                      <i style={{ left: `${8 + (energy ?? 0.5) * 84}%`, top: `${8 + (weight ?? 0.5) * 84}%` }} />
                    </div>
                    <span className={styles.mapHigh}>{checkup.result.map.high}</span>
                    <span className={styles.mapHeavy}>{checkup.result.map.heavy}</span>
                  </div>
                </div>

                {/* A few words for the heart they ended on. */}
                <div className={styles.message}>
                  <p className={styles.messageNote}>{checkup.result.messageNote(feeling.word)}</p>
                  <p className={styles.messageText}>{feeling.message}</p>
                </div>

                {/* Something true and interesting about a heart like this. */}
                <div className={styles.fact}>
                  <p className={styles.factNote}>{checkup.result.factNote}</p>
                  <p className={styles.factText}>{feeling.fact.text}</p>
                  <p className={styles.factSource}>
                    {checkup.result.factSource}: {feeling.fact.source}
                  </p>
                </div>

                {/* A heavy heart is offered somewhere to put it down, not a phone number. */}
                {row === 2 && (
                  <Link href={ventHref} transitionTypes={FORWARD} className={`${palette.card} ${styles.ventInvite}`} data-press>
                    <span className={styles.ventNote}>{checkup.result.vent.note}</span>
                    <span className={styles.ventTitle}>{checkup.result.vent.title}</span>
                    <span className={styles.ventBody}>{checkup.result.vent.body}</span>
                    <span className={`${palette.go} ${styles.ventGo}`} aria-hidden="true">
                      <svg width="22" height="22" viewBox="0 0 22 22">
                        <path d="M7 4 L15 11 L7 18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                  </Link>
                )}

                <p className={styles.nextLabel}>{checkup.result.next}</p>
                {forRow[row].order
                  .filter((id) => !((row === 0 || row === 2) && id === 'vent'))
                  .map((id) => (
                    <Link
                      key={id}
                      href={id === 'vent' ? ventHref : HREF[id]}
                      transitionTypes={FORWARD}
                      className={`${palette.card} ${styles.way}`}
                      data-way={id}
                      data-press
                    >
                      <span className={styles.wayWords}>
                        <span className={styles.wayTitle}>{checkup.result.ways[id].title}</span>
                        <span className={styles.wayBody}>{checkup.result.ways[id].body}</span>
                      </span>
                      <span className={palette.go} aria-hidden="true">
                        <svg width="20" height="20" viewBox="0 0 22 22">
                          <path d="M7 4 L15 11 L7 18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                    </Link>
                  ))}

                <Link href={careHref} className={`${palette.pill} ${styles.careQuiet}`} data-press>
                  {checkup.result.care}
                </Link>

                <div className={styles.end}>
                  <button type="button" className={styles.textBtn} data-press onClick={restart}>
                    {checkup.result.again}
                  </button>
                  <Link href="/" transitionTypes={BACK_TYPES} className={styles.textBtn} data-press>
                    {checkup.result.home}
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Question 1, made visible: a phone battery filling with the answer. */
function Battery({ level }: { level: number | null }) {
  const v = level ?? 0;
  const fill = v < 0.34 ? '#FF9A85' : v < 0.67 ? '#FFC94D' : '#6FD7B8';
  return (
    <span className={styles.gauge} data-empty={level === null}>
      <svg width="46" height="24" viewBox="0 0 46 24" aria-hidden="true">
        <rect x="1.5" y="1.5" width="38" height="21" rx="5" fill="#FFFFFF" stroke="#2A2140" strokeWidth="2" />
        <rect x="41" y="8" width="3.5" height="8" rx="1.5" fill="#2A2140" />
        <rect x="4.5" y="4.5" width={Math.max(0, 32 * v)} height="15" rx="2.5" fill={fill} />
      </svg>
      <b className={palette.num}>{level === null ? '—' : `${Math.round(v * 100)}%`}</b>
    </span>
  );
}

/** Question 2, made visible: a school bag filling with books. */
function Bag({ level }: { level: number | null }) {
  const books = level === null ? 0 : Math.round(level * 5);
  return (
    <span className={styles.gauge} data-empty={level === null}>
      <svg width="34" height="36" viewBox="0 0 34 36" aria-hidden="true">
        <path d="M11 7 C11 2 23 2 23 7" fill="none" stroke="#2A2140" strokeWidth="2" strokeLinecap="round" />
        <rect x="2" y="7" width="30" height="27" rx="7" fill="#FFFFFF" stroke="#2A2140" strokeWidth="2" />
        {Array.from({ length: books }, (_, i) => (
          <rect key={i} x="7" y={28 - i * 4.4} width="20" height="3.4" rx="1.2" fill={['#9BAAFF', '#FF9A85', '#FFC94D', '#6FD7B8', '#F0588A'][i]} />
        ))}
      </svg>
      <b className={palette.num}>{level === null ? '—' : `${books}/5`}</b>
    </span>
  );
}
