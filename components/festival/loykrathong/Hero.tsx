import Image from 'next/image';

import krathongArt from './art/krathong.webp';
import styles from './hero.module.css';

/**
 * The idle screen's picture: a lotus krathong afloat, its incense lit, from the
 * council's poster. It bobs on the water, and its candlelight (a rose-and-gold
 * halo and a warm pool on the water) flickers: the one warm accent in a blue night,
 * the thing that makes the screen glow from across the canteen.
 *
 * It fills the height of whatever it is put in; its width follows the art. The
 * screen puts it on the water.
 */
export function LoyKrathongHero() {
  return (
    <div className={styles.hero} aria-hidden="true">
      <span className={styles.halo} />
      <span className={styles.pool} />
      <div className={styles.float}>
        <Image src={krathongArt} alt="" sizes="45vh" loading="eager" className={styles.art} />
        <span className={styles.spark} />
      </div>
    </div>
  );
}
