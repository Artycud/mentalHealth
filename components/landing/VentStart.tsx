'use client';

import { useRouter } from 'next/navigation';
import { Fragment, useRef, useState } from 'react';

import { LiveHeart } from '@/components/heart/LiveHeart';
import palette from '@/components/heart/palette.module.css';
import { DriftingHints, Plane, SafeLine, Starters } from '@/components/vent/Invite';
import { vent } from '@/content/th/vent';
import { prefersReducedMotion } from '@/lib/frame';
import { FORWARD } from '@/lib/nav';
import { handOff } from '@/lib/vent/handoff';

import styles from './VentStart.module.css';

/** How long the paper airplane takes to fly off before the chat opens. */
const FLIGHT = 240;

/**
 * ระบายให้พี่สภาฟัง: the home's first slip and its main way in. It says plainly
 * what it is and that a person answers, then lets the student start right here:
 * quick replies to send with one tap, and a strip of notebook paper to write on
 * (starters drift through it while it is empty). Sending folds the words into a
 * paper airplane and opens the chat with them already on their way
 * (lib/vent/handoff carries them, in memory only). Sending with nothing written
 * just puts the cursor on the paper.
 */
export function VentStart() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState('');
  const [flying, setFlying] = useState(false);

  const go = (words: string) => {
    if (flying) return;
    handOff(words);
    if (prefersReducedMotion()) {
      router.push('/vent', { transitionTypes: FORWARD });
      return;
    }
    setFlying(true);
    setTimeout(() => router.push('/vent', { transitionTypes: FORWARD }), FLIGHT);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const words = text.trim();
    if (words) go(words);
    else inputRef.current?.focus();
  };

  return (
    <form className={`${palette.paper} ${styles.slip}`} onSubmit={submit} data-flying={flying}>
      <label htmlFor="vent-start" className={styles.head}>
        <span className={styles.words}>
          <span className={styles.title}>
            <span className={styles.phrase}>{vent.invite.title[0]}</span>
            <wbr />
            <span className={styles.phrase}>{vent.invite.title[1]}</span>
          </span>
          <span className={styles.sub}>
            {/* each phrase whole; the line breaks only at the space between them */}
            {vent.invite.sub.split(' ').map((phrase, i) => (
              <Fragment key={i}>
                {i > 0 && ' '}
                <span className={styles.phrase}>{phrase}</span>
              </Fragment>
            ))}
          </span>
        </span>
        {/* The heart in a speech bubble, listening, with LIVE on it. */}
        <span className={styles.listen}>
          <LiveHeart energy={0.5} weight={0.3} colour="rgb(255 143 181)" listening className={styles.heart} />
          <span className={styles.live}>
            <span className={styles.liveDot} aria-hidden="true" />
            {vent.invite.live}
          </span>
        </span>
      </label>

      <Starters onPick={go} disabled={flying} row className={styles.replies} />

      <div className={styles.bar}>
        <span className={styles.field}>
          <input
            ref={inputRef}
            id="vent-start"
            className={styles.input}
            type="text"
            value={text}
            maxLength={vent.composer.max}
            placeholder=" "
            enterKeyHint="send"
            autoComplete="off"
            onChange={(e) => setText(e.target.value)}
          />
          <DriftingHints />
        </span>
        <button type="submit" className={styles.send} data-press aria-label={vent.composer.send}>
          <span className={styles.plane}>
            <Plane />
          </span>
        </button>
      </div>

      <SafeLine className={styles.safe} />
    </form>
  );
}
