import styles from './Sky.module.css';

/**
 * The User Mode sky: light, warm white with the school's pink running through
 * it, and the paper grain, painted as ONE fixed layer.
 *
 * The grain used to be its own full-screen layer with `mix-blend-mode: multiply`,
 * which made a phone blend the whole screen on every scrolled frame. The grain
 * tile is already transparent, so it simply sits on top of the gradients here.
 */
export function Sky() {
  return <div className={styles.sky} aria-hidden="true" />;
}
