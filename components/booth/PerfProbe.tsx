'use client';

import { useEffect, useState, useSyncExternalStore, type CSSProperties } from 'react';

import { holdFrames } from '@/lib/frame';

/**
 * A performance probe for the booth screens, for finding what stutters on a real
 * iPad, where there is no developer tools to look with. Hidden unless the address
 * ends in ?perf.
 *
 * It shows how many frames a second the page itself gets (the page's own work:
 * anything Safari cannot hand to the GPU, and the jelly heart), the worst frame,
 * and whether Reduce Motion is on. Every running animation is listed by name, and
 * tapping one pauses it, so the one that costs the frames can be found by eye:
 * pause it, and see whether the rest smooths out.
 *
 * Staff tools only; never shown to students, and it costs nothing when hidden.
 */

type Group = { key: string; label: string; count: number };

/** Paused groups, kept across the kiosk's screens: a new screen's animations of a
    paused kind are paused too. */
const paused = new Set<string>();

/** A CSS module's keyframes are named file__hash__name; show "file: name". */
const labelOf = (name: string) => {
  const parts = name.split('__');
  return parts.length >= 3 ? `${parts[0].replace(/-module$/, '')}: ${parts[parts.length - 1]}` : name;
};

function cssAnimations() {
  return document.getAnimations().filter((a): a is CSSAnimation => 'animationName' in a);
}

const HEART = '(script) jelly heart';

/** Whether the address asks for the probe. It never changes while a screen is open. */
const asked = () => new URLSearchParams(window.location.search).has('perf');
const never = () => () => {};

export function PerfProbe() {
  const on = useSyncExternalStore(never, asked, () => false);
  const [open, setOpen] = useState(true);
  const [stats, setStats] = useState({ fps: 0, worst: 0, paced: false });
  const [groups, setGroups] = useState<Group[]>([]);
  const [, bump] = useState(0);

  // Frames per second of the page's own loop, reported once a second.
  useEffect(() => {
    if (!on) return;
    let raf = 0;
    let last = 0;
    let frames = 0;
    let worst = 0;
    let gaps: number[] = [];
    let since = performance.now();
    const tick = (now: number) => {
      if (last) {
        const gap = now - last;
        worst = Math.max(worst, gap);
        gaps.push(gap);
      }
      last = now;
      frames += 1;
      if (now - since >= 1000) {
        // Frames that all arrive about 33ms apart are Safari pacing the page to 30,
        // not the page running late (that is ragged: some 17ms, some 50ms).
        const paced = gaps.length > 20 && gaps.filter((g) => g > 28 && g < 40).length / gaps.length > 0.85;
        setStats({ fps: Math.round((frames * 1000) / (now - since)), worst: Math.round(worst), paced });
        frames = 0;
        worst = 0;
        gaps = [];
        since = now;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [on]);

  // The running animations, grouped by name; paused groups stay paused as screens change.
  useEffect(() => {
    if (!on) return;
    const look = () => {
      const byName = new Map<string, number>();
      for (const a of cssAnimations()) {
        byName.set(a.animationName, (byName.get(a.animationName) ?? 0) + 1);
        if (paused.has(a.animationName) && a.playState === 'running') a.pause();
      }
      setGroups(
        [...byName]
          .map(([key, count]) => ({ key, label: labelOf(key), count }))
          .sort((a, b) => a.label.localeCompare(b.label)),
      );
    };
    look();
    const timer = setInterval(look, 1500);
    return () => clearInterval(timer);
  }, [on]);

  if (!on) return null;

  const toggle = (key: string) => {
    const pause = !paused.has(key);
    if (pause) paused.add(key);
    else paused.delete(key);
    if (key === HEART) holdFrames(pause);
    else
      for (const a of cssAnimations()) {
        if (a.animationName !== key) continue;
        if (pause) a.pause();
        else a.play();
      }
    bump((n) => n + 1);
  };

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const colour = stats.fps >= 55 ? '#7dff9b' : stats.fps >= 40 ? '#ffd24d' : '#ff6b6b';

  return (
    <div style={panel}>
      <button type="button" style={head} onClick={() => setOpen((o) => !o)}>
        <b style={{ color: colour }}>{stats.fps} fps</b> · worst {stats.worst}ms
        {stats.paced && ' · capped at 30 by Safari'}
        {reduce && ' · REDUCE MOTION ON'}
      </button>
      {open && (
        <div style={list}>
          <div style={note}>
            {reduce
              ? 'Reduce Motion is on: animations are stopped on purpose. Settings → Accessibility → Motion.'
              : stats.fps >= 55
                ? 'The page keeps up. If it still looks choppy, the GPU is the limit: tap one to pause it and see if the rest smooths out. Tap the top line to hide this.'
                : 'Tap one to pause it. If the fps climbs, that one is the cost. Tap the top line to hide this.'}
          </div>
          {[{ key: HEART, label: HEART, count: 0 }, ...groups].map((g) => (
            <button
              key={g.key}
              type="button"
              style={{ ...row, opacity: paused.has(g.key) ? 0.45 : 1 }}
              onClick={() => toggle(g.key)}
            >
              {paused.has(g.key) ? '❚❚ ' : '▶ '}
              {g.label}
              {g.count > 0 && ` ×${g.count}`}
            </button>
          ))}
          <div style={note}>
            {window.innerWidth}×{window.innerHeight} @{window.devicePixelRatio}x ·{' '}
            {/OS ([\d_]+)/.exec(navigator.userAgent)?.[1]?.replace(/_/g, '.') ?? navigator.platform}
          </div>
        </div>
      )}
    </div>
  );
}

const panel: CSSProperties = {
  position: 'fixed',
  left: 8,
  top: 8,
  zIndex: 2147483647,
  maxWidth: 'min(420px, 90vw)',
  maxHeight: '80vh',
  overflow: 'auto',
  background: 'rgba(0,0,0,0.82)',
  color: '#fff',
  font: '13px/1.35 ui-monospace, Menlo, monospace',
  borderRadius: 8,
  // Its own layer, so its once-a-second update repaints only itself.
  willChange: 'transform',
};
const head: CSSProperties = {
  display: 'block',
  width: '100%',
  padding: '8px 10px',
  textAlign: 'left',
  color: 'inherit',
  font: 'inherit',
  background: 'none',
  border: 0,
};
const list: CSSProperties = { padding: '0 10px 8px' };
const note: CSSProperties = { opacity: 0.7, margin: '4px 0 6px' };
const row: CSSProperties = {
  display: 'block',
  width: '100%',
  padding: '7px 0',
  textAlign: 'left',
  color: 'inherit',
  font: 'inherit',
  background: 'none',
  border: 0,
  borderTop: '1px solid rgba(255,255,255,0.12)',
};
