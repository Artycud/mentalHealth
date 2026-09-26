'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

import { checkup } from '@/content/th/checkup';
import { feelings, forRow, type WayId } from '@/content/th/heart';
import { blobPath, cell, moodColour, rgb } from '@/lib/heart';

import styles from './Checkup.module.css';

type Step = 'meet' | 'energy' | 'weight' | 'whole' | 'topics' | 'result';

const HREF: Record<WayId, string> = { self: '/me', vent: '/vent', checkin: '/checkin' };
const NEUTRAL: [number, number, number] = [214, 204, 220];
const TOPIC_INKS = ['#6FD7B8', '#FFC94D', '#9BAAFF', '#FF9A85', '#F0588A', '#8FD0FF', '#C9B8D8'];

/** Which third of 0 → 1 a value is in. */
const third = (v: number) => (v < 0.34 ? 0 : v < 0.67 ? 1 : 2);

/**
 * The guided check-up. One persistent heart on one sky; the words and the
 * controls around it change step by step. The heart's size, wobble, weight and
 * colour are written straight to the DOM from one animation loop, so React only
 * re-renders when a step or an answer changes.
 */
export function Checkup({ careHref }: { careHref: string }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);

  const [step, setStep] = useState<Step>('meet');
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
  });
  useEffect(() => {
    live.current.step = step;
  }, [step]);
  useEffect(() => {
    if (energy !== null) live.current.energy = energy;
  }, [energy]);
  useEffect(() => {
    if (weight !== null) live.current.weight = weight;
  }, [weight]);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const t0 = performance.now();
    let last = t0;
    let scale = 0.14;
    let reveal = 0;
    let pull = 0;
    let raf = 0;

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const s = live.current;
      const t = reduce ? 0 : (now - t0) / 1000;

      // The heart grows in from a point of light on arrival, and steps back for the result.
      const target = s.step === 'result' ? 0.78 : 1;
      scale += (target - scale) * Math.min(1, dt * 2.2);

      // The colour only arrives once both questions are answered.
      const revealed = s.step === 'whole' || s.step === 'topics' || s.step === 'result';
      reveal += ((revealed ? 1 : 0) - reveal) * Math.min(1, dt * 1.4);
      const mood = moodColour(s.energy, s.weight);
      const c: [number, number, number] = [0, 1, 2].map((i) => NEUTRAL[i] + (mood[i] - NEUTRAL[i]) * reveal) as never;
      rootRef.current?.style.setProperty('--c', rgb(c));

      pull += ((s.dragging ? 1 : 0) - pull) * 0.12;
      const quiet = s.step === 'meet';
      pathRef.current?.setAttribute(
        'd',
        blobPath({
          energy: quiet ? 0.12 : s.energy,
          weight: quiet ? 0.35 : s.step === 'energy' ? 0.35 : s.weight,
          t,
          scale,
          pullAngle: s.angle,
          pull,
        }),
      );
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  // ---- dragging, constrained to the question being asked ----
  const read = (e: React.PointerEvent) => {
    const r = stageRef.current!.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    const y = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
    live.current.angle = Math.atan2(y - 0.5, x - 0.5);
    if (step === 'energy') {
      live.current.angle = x < 0.5 ? Math.PI : 0;
      setEnergy(x);
    } else if (step === 'weight') {
      live.current.angle = y < 0.5 ? -Math.PI / 2 : Math.PI / 2;
      setWeight(y);
    } else if (step === 'whole') {
      setEnergy(x);
      setWeight(y);
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
    setStep('meet');
  };

  return (
    <div ref={rootRef} className={styles.root} data-step={step}>
      <div className={styles.sky} aria-hidden="true" />
      <div className={styles.grain} aria-hidden="true" />

      <div className={styles.frame}>
        {/* ---- words above the heart ---- */}
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
              <h1 className={styles.title}>{checkup.energy.title}</h1>
            </>
          )}
          {step === 'weight' && (
            <>
              <p className={styles.note}>{checkup.weight.note}</p>
              <h1 className={styles.title}>{checkup.weight.title}</h1>
            </>
          )}
          {step === 'whole' && (
            <>
              <p className={styles.note}>{checkup.whole.note}</p>
              <h1 className={styles.bigWord}>{feeling.word}</h1>
              <p className={styles.body}>{feeling.line}</p>
            </>
          )}
          {step === 'topics' && (
            <>
              <p className={styles.note}>
                {checkup.topics.note} &quot;{feeling.word}&quot;
              </p>
              <h1 className={styles.title}>{checkup.topics.title}</h1>
              <p className={styles.body}>{checkup.topics.body}</p>
            </>
          )}
          {step === 'result' && (
            <>
              <p className={styles.note}>{checkup.result.note}</p>
              <h1 className={styles.bigWord}>{feeling.word}</h1>
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
          aria-valuenow={
            draggable ? Math.round(((step === 'weight' ? weight : energy) ?? 0.5) * 100) : undefined
          }
        >
          <div className={styles.glow} aria-hidden="true" />

          {step === 'energy' && (
            <div className={styles.hTrack} aria-hidden="true">
              <span>{checkup.energy.ends.low}</span>
              <span>{checkup.energy.ends.high}</span>
              {energy !== null && <i style={{ left: `${energy * 100}%` }} />}
            </div>
          )}
          {step === 'weight' && (
            <div className={styles.vTrack} aria-hidden="true">
              <span>{checkup.weight.ends.light}</span>
              <span>{checkup.weight.ends.heavy}</span>
              {weight !== null && <i style={{ top: `${weight * 100}%` }} />}
            </div>
          )}
          {step === 'whole' && <div className={styles.rings} aria-hidden="true" />}

          <svg className={styles.blob} viewBox="-160 -160 320 320" aria-hidden="true">
            <defs>
              <radialGradient id="checkup-fill" cx="38%" cy="32%" r="75%">
                <stop offset="0%" style={{ stopColor: 'color-mix(in oklab, var(--c) 45%, #FFFFFF)' }} />
                <stop offset="55%" style={{ stopColor: 'var(--c)' }} />
                <stop offset="100%" style={{ stopColor: 'color-mix(in oklab, var(--c) 75%, #8A3D63)' }} />
              </radialGradient>
            </defs>
            <path ref={pathRef} fill="url(#checkup-fill)" />
          </svg>

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
            <button type="button" className={styles.primary} onClick={() => setStep('energy')}>
              {checkup.meet.go}
            </button>
          )}

          {step === 'energy' && (
            <>
              <p className={styles.anchor}>
                {energy === null ? checkup.energy.hint : checkup.energy.anchors[third(energy)]}
              </p>
              <button
                type="button"
                className={styles.primary}
                data-off={energy === null}
                onClick={() => energy !== null && setStep('weight')}
              >
                {checkup.energy.go}
              </button>
            </>
          )}

          {step === 'weight' && (
            <>
              <p className={styles.anchor}>
                {weight === null ? checkup.weight.hint : checkup.weight.anchors[third(weight)]}
              </p>
              <button
                type="button"
                className={styles.primary}
                data-off={weight === null}
                onClick={() => weight !== null && setStep('whole')}
              >
                {checkup.weight.go}
              </button>
            </>
          )}

          {step === 'whole' && (
            <>
              <p className={styles.sub}>{checkup.whole.body}</p>
              <button type="button" className={styles.primary} onClick={() => setStep('topics')}>
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
                    aria-pressed={topics.includes(t)}
                    onClick={() => toggleTopic(t)}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <button type="button" className={styles.primary} onClick={() => setStep('result')}>
                {topics.length ? checkup.topics.go : checkup.topics.none}
              </button>
            </>
          )}

          {step === 'result' && (
            <div className={styles.result}>
              {/* A few words for the heart they ended on. */}
              <div className={styles.message}>
                <p className={styles.messageNote}>{checkup.result.messageNote(feeling.word)}</p>
                <p className={styles.messageText}>{feeling.message}</p>
              </div>

              {topics.length > 0 && (
                <p className={styles.topicLine}>
                  <span>{checkup.result.topicsLabel}</span> {topics.join(' · ')}
                </p>
              )}

              {/* A heavy heart is offered somewhere to put it down, not a phone number. */}
              {row === 2 && (
                <Link href={ventHref} className={styles.ventInvite}>
                  <span className={styles.ventNote}>{checkup.result.vent.note}</span>
                  <span className={styles.ventTitle}>{checkup.result.vent.title}</span>
                  <span className={styles.ventBody}>{checkup.result.vent.body}</span>
                  <span className={styles.ventGo} aria-hidden="true">
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
                  <Link key={id} href={id === 'vent' ? ventHref : HREF[id]} className={styles.way} data-way={id}>
                    <span className={styles.wayTitle}>{checkup.result.ways[id].title}</span>
                    <span className={styles.wayBody}>{checkup.result.ways[id].body}</span>
                  </Link>
                ))}

              <Link href={careHref} className={styles.careQuiet}>
                {checkup.result.care}
              </Link>

              <div className={styles.end}>
                <button type="button" className={styles.textBtn} onClick={restart}>
                  {checkup.result.again}
                </button>
                <Link href="/" className={styles.textBtn}>
                  {checkup.result.home}
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
