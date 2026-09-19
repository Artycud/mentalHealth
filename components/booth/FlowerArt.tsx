import { BoothMarigold } from '@/components/illustrations/scenes';
import type { Flower } from '@/content/th/booth';

import { backdropToneFor, ResultBackdrop } from './art';
import styles from './FlowerArt.module.css';
import { WallFlower } from './WallFlower';

/**
 * A booth result's flower on its backdrop: a paper-cut disc, the flower on top,
 * a bloom when it arrives (BRIEF §9) and a slow breath afterwards.
 *
 * It fills whatever box it is put in, which should be square. The kiosk and the
 * phone both use it, so a flower looks the same wherever a student sees it.
 *
 * INTERIM ART: only the marigold has a hand-drawn illustration. The other five
 * show the tinted rosette from the TV wall until each gets its own drawing. It is
 * a stand-in, not the finished art, and must not be mistaken for a lotus or an
 * orchid.
 */
export function FlowerArt({ flower }: { flower: Flower }) {
  return (
    <div className={styles.stack}>
      <div className={styles.layer}>
        <ResultBackdrop tone={backdropToneFor(flower.tint)} />
      </div>
      {/* Re-keyed per flower so the bloom plays again for each new result. */}
      <div className={`${styles.flowerWrap} ${styles.bloom}`} key={flower.id}>
        {flower.id === 'marigold' ? (
          <BoothMarigold viewBox="70 12 216 228" />
        ) : (
          <WallFlower tint={flower.tint} size={320} />
        )}
      </div>
    </div>
  );
}
