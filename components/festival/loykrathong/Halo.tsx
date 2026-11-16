import styles from './halo.module.css';

/**
 * Moonlight: a soft halo around the moon, warm close to it and fading into a
 * wide, cool wash across the sky, breathing very slowly. No shapes, only light.
 * It fills its parent, centred on it, and reaches well past it (see
 * halo.module.css). Plain gradients that only change opacity and scale, so an old
 * iPad just fades a layer.
 */
export function MoonHalo() {
  return (
    <span className={styles.halo} aria-hidden="true">
      <span className={styles.wash} />
      <span className={styles.warm} />
    </span>
  );
}
