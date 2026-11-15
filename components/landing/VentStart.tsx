'use client';

import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';

import { LiveHeart } from '@/components/heart/LiveHeart';
import palette from '@/components/heart/palette.module.css';
import { DriftingHints, Plane, SafeLine, Starters, TimeAsk } from '@/components/vent/Invite';
import { vent } from '@/content/th/vent';
import { prefersReducedMotion } from '@/lib/frame';
import { FORWARD } from '@/lib/nav';
import { handOff } from '@/lib/vent/handoff';

import styles from './VentStart.module.css';

/** How long the paper airplane takes to fly off before the chat opens. */
const FLIGHT = 240;

/**
 * VENT on the home, made to be answered rather than filled in: the little heart
 * asks something that fits the hour, the answer goes on a strip of notebook
 * paper (starters drift through it while it is empty), and a few starters can be
 * sent with one tap. Sending folds the words into a paper airplane and opens the
 * chat with them already on their way (lib/vent/handoff carries them, in memory
 * only). Sending with nothing written just puts the cursor on the paper.
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
      {/* The heart asks, in a speech bubble: a reply is easier to write than a blank box. */}
      <label htmlFor="vent-start" className={styles.asks}>
        <LiveHeart energy={0.45} weight={0.35} colour="rgb(255 143 181)" className={styles.heart} />
        <span className={styles.bubble}>
          <TimeAsk className={styles.ask} />
        </span>
      </label>

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

      <p className={styles.orTap}>{vent.invite.orTap}</p>
      <Starters onPick={go} disabled={flying} row />
      <SafeLine className={styles.safe} />
    </form>
  );
}
