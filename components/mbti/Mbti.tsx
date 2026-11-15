'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, type CSSProperties } from 'react';

import { BackButton } from '@/components/heart/BackButton';
import palette from '@/components/heart/palette.module.css';
import { axes, mbti, mbtiQuestions, mbtiTypes, type Pole } from '@/content/th/mbti';
import { haptic } from '@/lib/haptics';
import { scoreMbti } from '@/lib/mbti';
import { BACK as BACK_TYPES, FORWARD } from '@/lib/nav';

import styles from './Mbti.module.css';

const COUNT = mbtiQuestions.length;
/** How long a tapped answer stays lit before the next question slides in. */
const SETTLE = 280;

/**
 * "รู้จักตัวเองอีกนิด": twelve quick either/or questions (content/th/mbti.ts),
 * then the type they point to, how clear each side was, and something kind for
 * a tired day.
 *
 * One question a screen. Tapping an answer lights it, fills the progress bar, and
 * slides the next one in; back steps to the previous question with its answer
 * still lit, so changing a mind is one tap. Nothing is stored.
 */
export function Mbti() {
  /** -1: the intro; 0…11: a question; 12: the result. */
  const [at, setAt] = useState(-1);
  const [answers, setAnswers] = useState<(Pole | undefined)[]>(() => Array(COUNT).fill(undefined));
  const [dir, setDir] = useState<'forward' | 'back'>('forward');
  /** The answer just tapped, lit while the next question waits to come in. */
  const [lit, setLit] = useState<number | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const go = (next: number, way: 'forward' | 'back') => {
    clearTimeout(timer.current);
    setLit(null);
    setDir(way);
    setAt(next);
    window.scrollTo({ top: 0 });
  };

  const choose = (i: number) => {
    if (lit !== null) return;
    const q = mbtiQuestions[at];
    setAnswers((a) => a.map((p, k) => (k === at ? q.options[i].pole : p)));
    setLit(i);
    haptic(at === COUNT - 1 ? 'done' : 'step');
    timer.current = setTimeout(() => go(at + 1, 'forward'), SETTLE);
  };

  const again = () => {
    setAnswers(Array(COUNT).fill(undefined));
    go(0, 'back');
  };

  const result = at === COUNT ? scoreMbti(answers) : undefined;
  // How far along: the questions answered, and the one just tapped.
  const done = Math.min(COUNT, Math.max(0, at) + (lit !== null ? 1 : 0));

  return (
    <div className={styles.root} data-dir={dir}>
      <div className={styles.bar}>
        {at <= 0 ? <BackButton href="/" /> : <BackButton onBack={() => go(at - 1, 'back')} />}
        {at >= 0 && at < COUNT && (
          <div
            className={styles.progress}
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={COUNT}
            aria-valuenow={done}
            aria-label={mbti.count(at + 1, COUNT)}
          >
            <span className={styles.track}>
              <span className={styles.fill} style={{ transform: `scaleX(${done / COUNT})` }} />
            </span>
            <span className={styles.count}>
              {at + 1}/{COUNT}
            </span>
          </div>
        )}
      </div>

      {at === -1 && (
        <section className={styles.screen} key="intro">
          <div className={styles.letters} aria-hidden="true">
            {/* Which four are yours? */}
            {[0, 1, 2, 3].map((i) => (
              <span key={i} data-i={i}>
                ?
              </span>
            ))}
          </div>
          <p className={styles.note}>{mbti.intro.note}</p>
          <h1 className={styles.title}>{mbti.intro.title}</h1>
          <p className={styles.body}>{mbti.intro.body}</p>
          <button type="button" className={`${palette.primary} ${styles.start}`} data-press onClick={() => go(0, 'forward')}>
            {mbti.intro.go}
          </button>
        </section>
      )}

      {at >= 0 && at < COUNT && (
        <section className={styles.screen} key={`q${at}`}>
          <p className={styles.note}>{mbti.count(at + 1, COUNT)}</p>
          <h1 className={styles.ask}>{mbtiQuestions[at].ask}</h1>
          <div className={styles.options}>
            {mbtiQuestions[at].options.map((o, i) => {
              const on = lit === null ? answers[at] === o.pole : lit === i;
              return (
                <button
                  key={o.pole}
                  type="button"
                  className={styles.option}
                  data-i={i}
                  aria-pressed={on}
                  data-press
                  onClick={() => choose(i)}
                >
                  <span className={styles.mark} aria-hidden="true">
                    {on && (
                      <svg width="16" height="16" viewBox="0 0 16 16">
                        <path d="M3 8.5 L6.5 12 L13 4.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </span>
                  {o.text}
                </button>
              );
            })}
          </div>
          {at === 0 && <p className={styles.hint}>{mbti.hint}</p>}
        </section>
      )}

      {result && (
        <section className={styles.screen} key="result">
          <p className={styles.note}>{mbti.result.note}</p>
          <h1 className={styles.type}>
            {result.type.split('').map((l, i) => (
              <span key={i} data-i={i} style={{ '--i': i } as CSSProperties}>
                {l}
              </span>
            ))}
          </h1>
          <p className={styles.typeName}>{mbtiTypes[result.type].name}</p>

          <div className={styles.card}>
            <p className={styles.line}>{mbtiTypes[result.type].line}</p>
            <p className={styles.cardNote}>{mbti.result.strengthNote}</p>
            <p className={styles.cardText}>{mbtiTypes[result.type].strength}</p>
          </div>

          <div className={`${styles.card} ${styles.care}`}>
            <p className={styles.cardNote}>{mbti.result.careNote}</p>
            <p className={styles.cardText}>{mbtiTypes[result.type].care}</p>
          </div>

          <div className={`${styles.card} ${styles.sides}`}>
            <p className={styles.sidesTitle}>{mbti.result.sidesTitle}</p>
            {result.sides.map((s) => {
              const [a, b] = s.axis.split('') as [Pole, Pole];
              // Where the answers sit between the two ends: 3 of 3 near an end, 2 of 3 nearer the middle.
              const toB = s.pole === b ? s.votes / s.of : 1 - s.votes / s.of;
              return (
                <div key={s.axis} className={styles.side}>
                  <p className={styles.sideName}>{axes[s.axis].name}</p>
                  <div className={styles.ends}>
                    <span data-on={s.pole === a}>
                      <b>{a}</b> {axes[s.axis].poles[a]}
                    </span>
                    <span data-on={s.pole === b}>
                      {axes[s.axis].poles[b]} <b>{b}</b>
                    </span>
                  </div>
                  <div className={styles.scale} aria-hidden="true">
                    <i style={{ left: `${10 + toB * 80}%` }} />
                  </div>
                  <p className={styles.how}>{s.votes === s.of ? mbti.result.clear(s.pole) : mbti.result.lean(s.pole)}</p>
                </div>
              );
            })}
          </div>

          <p className={styles.honest}>{mbti.result.honest}</p>

          <p className={styles.nextLabel}>{mbti.result.next}</p>
          <Link href="/checkup?start=1" transitionTypes={FORWARD} className={`${palette.primary} ${styles.start}`} data-press>
            {mbti.result.checkup}
          </Link>
          <div className={styles.end}>
            <button type="button" className={styles.textBtn} data-press onClick={again}>
              {mbti.result.again}
            </button>
            <Link href="/" transitionTypes={BACK_TYPES} className={styles.textBtn} data-press>
              {mbti.result.home}
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
