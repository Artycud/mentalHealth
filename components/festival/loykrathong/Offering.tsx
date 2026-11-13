import Image from 'next/image';
import type { ReactNode } from 'react';

import handsArt from './art/hands.webp';
import styles from './offering.module.css';

/**
 * The result's flower, given back: set in a lotus krathong held out in two hands,
 * from the council's poster ("ปล่อยวางสิ่งที่หนักอึ้งในใจให้ลอยออกไป"). The candle
 * flickers and the hands rise and settle, as if offering it.
 *
 * It fills its parent; the flower (children) sits at the heart of the lotus.
 */
export function LoyKrathongOffering({ children }: { children: ReactNode }) {
  return (
    <div className={styles.offering}>
      <span className={styles.halo} aria-hidden="true" />
      <div className={styles.lift}>
        <Image src={handsArt} alt="" sizes="30vh" loading="eager" className={styles.hands} aria-hidden="true" />
        <span className={styles.flame} aria-hidden="true" />
        <div className={styles.flower}>{children}</div>
      </div>
    </div>
  );
}
