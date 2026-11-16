import Image from 'next/image';

import moonArt from './art/moon.webp';
import styles from './moon.module.css';
import { MoonRays } from './Rays';

/**
 * The poster's full moon, for a round thing the screen already has (the TV's count).
 * It fills its parent: the moon's disc matches the parent's circle and its soft
 * edge spills just past it, with moonlight rays fanning out behind it. Anything
 * the screen puts on top stays on top.
 */
export function LoyKrathongMoon() {
  return (
    <>
      <span className={styles.rays}>
        <MoonRays id="lk-rays-moon" />
      </span>
      <Image src={moonArt} alt="" sizes="40vh" loading="eager" className={styles.moon} aria-hidden="true" />
    </>
  );
}
