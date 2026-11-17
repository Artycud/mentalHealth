import { useId } from 'react';

import styles from './VentStart.module.css';

/**
 * A glossy pink heart floating in a glass speech bubble, its tail toward the
 * words: someone is listening. Drawn as SVG so it stays sharp on any screen;
 * the heart bobs gently (still under reduced motion).
 */
export function GlassHeart({ className }: { className?: string }) {
  const id = useId().replace(/:/g, '');
  const glass = `${id}g`;
  const heart = `${id}h`;
  const shade = `${id}s`;
  const soft = `${id}f`;

  return (
    <svg className={className} viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id={glass} cx="42%" cy="38%" r="62%">
          <stop offset="0" stopColor="#fff" stopOpacity="0.55" />
          <stop offset="0.6" stopColor="#fff4f9" stopOpacity="0.45" />
          <stop offset="1" stopColor="#ffe2ef" stopOpacity="0.95" />
        </radialGradient>
        <radialGradient id={heart} cx="34%" cy="28%" r="78%">
          <stop offset="0" stopColor="#ffc1d5" />
          <stop offset="0.42" stopColor="#ff7fa6" />
          <stop offset="0.8" stopColor="#f2557f" />
          <stop offset="1" stopColor="#d93f6c" />
        </radialGradient>
        <linearGradient id={shade} x1="0" y1="0.35" x2="0" y2="1">
          <stop offset="0" stopColor="#a8174f" stopOpacity="0" />
          <stop offset="1" stopColor="#a8174f" stopOpacity="0.28" />
        </linearGradient>
        <filter id={soft} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.6" />
        </filter>
      </defs>

      {/* the bubble: one shape, circle and tail, so the glass never doubles up */}
      <path
        d="M32 82.6A40 40 0 1 0 17.4 68Q16 82 10 91Q22 90 32 82.6Z"
        fill={`url(#${glass})`}
        stroke="#fff"
        strokeOpacity="0.95"
        strokeWidth="1.6"
      />
      {/* light on the glass: a bright arc top-left, a faint one bottom-right */}
      <path d="M20 36.4A34 34 0 0 1 40.4 16" fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" />
      <path d="M84.9 60A35 35 0 0 1 69.5 78.3" fill="none" stroke="#fff" strokeOpacity="0.6" strokeWidth="2" strokeLinecap="round" />

      {/* the heart's shadow on the bubble's floor */}
      <ellipse cx="52" cy="77.5" rx="15" ry="2.8" fill="#c2366b" opacity="0.2" filter={`url(#${soft})`} />

      <g className={styles.bob}>
        <g transform="translate(24.5 21.5) scale(0.55)">
          <path
            d="M50 88C20 66 6 48 10 30C14 14 34 8 50 26C66 8 86 14 90 30C94 48 80 66 50 88Z"
            fill={`url(#${heart})`}
          />
          <path d="M50 88C20 66 6 48 10 30C14 14 34 8 50 26C66 8 86 14 90 30C94 48 80 66 50 88Z" fill={`url(#${shade})`} />
          {/* gloss: a soft sheen on the left lobe and one sharp glint */}
          <ellipse cx="29" cy="29" rx="11" ry="6.5" fill="#fff" opacity="0.62" transform="rotate(-32 29 29)" filter={`url(#${soft})`} />
          <circle cx="24" cy="27" r="2.8" fill="#fff" opacity="0.95" />
          <ellipse cx="72" cy="27" rx="5" ry="2.6" fill="#fff" opacity="0.35" transform="rotate(28 72 27)" />
        </g>
      </g>
    </svg>
  );
}
