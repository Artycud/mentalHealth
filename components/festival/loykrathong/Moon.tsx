import Image from 'next/image';

import moonArt from './art/moon.webp';
import styles from './moon.module.css';

/**
 * The poster's full moon, for a round thing the screen already has (the TV's count).
 * It fills its parent: the moon's disc matches the parent's circle and its soft
 * edge spills just past it. Anything the screen puts on top stays on top.
 */
export function LoyKrathongMoon() {
  return <Image src={moonArt} alt="" sizes="40vh" loading="eager" className={styles.moon} aria-hidden="true" />;
}
