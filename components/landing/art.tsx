/**
 * Small drawings for "ทุกรอบมี": the same soft shapes as the hearts, each doing
 * one quiet thing. Motion is CSS only and stops under reduced motion.
 */
import styles from './Landing.module.css';

export function MusicArt() {
  return (
    <svg viewBox="0 0 120 90" className={styles.art} aria-hidden="true">
      <path d="M22 52 C18 26 44 12 66 18 C92 24 104 48 94 66 C84 84 32 84 22 52 Z" fill="#6FD7B8" />
      {[38, 52, 66, 80].map((x, i) => (
        <rect key={x} x={x - 4} y="30" width="8" height="34" rx="4" fill="#2A2140" className={styles.bar} style={{ animationDelay: `${i * -0.35}s` }} />
      ))}
      <path d="M100 14 L100 34 M100 14 L112 10 L112 30" fill="none" stroke="#F0588A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={styles.musicNote} />
      <circle cx="96" cy="35" r="5" fill="#F0588A" className={styles.musicNote} />
      <circle cx="108" cy="31" r="5" fill="#F0588A" className={styles.musicNote} />
    </svg>
  );
}

export function FoodArt() {
  return (
    <svg viewBox="0 0 120 90" className={styles.art} aria-hidden="true">
      <path d="M16 46 L104 46 C104 70 84 84 60 84 C36 84 16 70 16 46 Z" fill="#FFC94D" />
      <path d="M10 46 L110 46" stroke="#2A2140" strokeWidth="4" strokeLinecap="round" />
      {[42, 60, 78].map((x, i) => (
        <path key={x} d={`M${x} 38 C${x - 6} 30 ${x + 6} 24 ${x} 16`} fill="none" stroke="#F0588A" strokeWidth="3" strokeLinecap="round" className={styles.steam} style={{ animationDelay: `${i * -0.8}s` }} />
      ))}
    </svg>
  );
}

export function BoothArt() {
  return (
    <svg viewBox="0 0 120 90" className={styles.art} aria-hidden="true">
      <path d="M20 50 C16 30 34 18 52 22 C70 26 76 46 66 60 C56 74 24 70 20 50 Z" fill="#FF9A85" className={styles.sway} />
      <path d="M52 44 C50 24 72 12 90 20 C108 28 106 54 92 64 C78 74 54 66 52 44 Z" fill="#9BAAFF" style={{ mixBlendMode: 'multiply' }} className={styles.sway2} />
      <path d="M30 78 C44 70 60 84 76 76 C88 70 96 78 104 74" fill="none" stroke="#2A2140" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
