import styles from './VentStart.module.css';

/** A heart cut a little by hand: the right lobe sits higher than the left. */
const HEART = 'M50 86C24 68 8 51 12 33C15 18 35 12 50 29C64 11 87 16 89 33C92 51 77 68 50 86Z';

/**
 * A pink heart printed on a cream paper speech bubble, its tail toward the words:
 * someone is listening. Made the way the booth's flower marks are (WallFlower):
 * flat inks multiplied, the pale one a touch out of register, the dotted ink ring
 * and three ink dots. No gradients or gloss. The heart beats slowly (still under
 * reduced motion).
 */
export function PaperHeart({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      {/* the bubble: one shape, circle and tail */}
      <path d="M32 82.6A40 40 0 1 0 17.4 68Q16 82 10 91Q22 90 32 82.6Z" fill="var(--paper-raised)" />
      <circle cx="52" cy="48" r="33" className="ln-dot" opacity="0.3" />

      <g className={styles.beat}>
        <g transform="translate(24.5 21.5) scale(0.55)">
          <path d={HEART} fill="#ffc1da" className="mul" transform="translate(5 4)" />
          <path d={HEART} fill="#ff6fae" className="mul" />
          <path d="M31 37L31.1 37M39 30L39.1 30M36 45L36.1 45" className="ln" />
        </g>
      </g>
    </svg>
  );
}
