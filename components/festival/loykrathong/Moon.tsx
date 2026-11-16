import Image from 'next/image';

import moonArt from './art/moon.webp';
import styles from './moon.module.css';
import { MoonHalo } from './Halo';

/**
 * The poster's full moon, for a round thing the screen already has (the TV's count).
 * It fills its parent: the moon's disc matches the parent's circle and its soft
 * edge spills just past it, with a halo of moonlight behind it. Anything the
 * screen puts on top stays on top.
 */
export function LoyKrathongMoon() {
  return (
    <>
      <span className={styles.halo}>
        <MoonHalo />
      </span>
      <Image src={moonArt} alt="" sizes="40vh" loading="eager" className={styles.moon} aria-hidden="true" />
    </>
  );
}
