import type { CSSProperties } from 'react';

import { BOOTH_MARIGOLD_RING, BoothMarigold } from '@/components/illustrations/scenes';
import type { Flower } from '@/content/th/booth';

import { backdropToneFor, ResultBackdrop } from './art';
import styles from './FlowerArt.module.css';
import { WALL_FLOWER_RING } from './flower-marks';
import { FlowerPortrait, hasPortrait } from './FlowerPortrait';
import { WallFlower } from './WallFlower';

type Ring = { cx: number; cy: number; r: number };

/** The kiosk result crops the marigold to its head, stem and leaf. */
const MARIGOLD_VIEWBOX = [70, 12, 216, 228] as const;
const WALL_VIEWBOX = [0, 0, 100, 100] as const;

/**
 * Where a drawing's ring lands in the flower's square box, as percentages of it.
 * The drawing is fitted into the square the way an <svg> fits its viewBox by
 * default: scaled to fit, and centred.
 */
function ringBox([vx, vy, vw, vh]: readonly number[], { cx, cy, r }: Ring): CSSProperties {
  const scale = 1 / Math.max(vw, vh);
  const left = (1 - vw * scale) / 2 + (cx - r - vx) * scale;
  const top = (1 - vh * scale) / 2 + (cy - r - vy) * scale;
  const pct = (n: number) => `${(n * 100).toFixed(3)}%`;
  return { left: pct(left), top: pct(top), width: pct(2 * r * scale) };
}

/**
 * A booth result's flower on its backdrop: a paper-cut disc, the flower on top,
 * a bloom when it arrives (BRIEF §9) and a slow breath afterwards.
 *
 * It fills whatever box it is put in, which must be square. The kiosk and the
 * phone both use it, so a flower looks the same wherever a student sees it.
 *
 * The flower's dotted ring turns for as long as it is on screen. It is drawn as
 * its own small layer over the flower, not inside the flower's drawing, because a
 * turning part inside an SVG makes Safari repaint the whole flower on every frame
 * (an old iPad cannot keep up), where a layer of its own is simply rotated by the
 * GPU. Nothing in the drawing overlaps the ring, so it looks the same.
 *
 * Each of the six booth flowers has its own drawing (./FlowerPortrait); the old
 * marigold keeps its hand-drawn one, and anything else falls back to the TV
 * wall's tinted rosette.
 */
export function FlowerArt({ flower }: { flower: Flower }) {
  const marigold = flower.id === 'marigold';
  const viewBox = marigold ? MARIGOLD_VIEWBOX : WALL_VIEWBOX;
  const ring: Ring = marigold ? BOOTH_MARIGOLD_RING : WALL_FLOWER_RING;
  return (
    <div className={styles.stack}>
      <div className={styles.layer}>
        <ResultBackdrop tone={backdropToneFor(flower.tint)} />
      </div>
      {/* Re-keyed per flower so the bloom plays again for each new result. */}
      <div className={`${styles.flowerWrap} ${styles.bloom}`} key={flower.id}>
        {marigold ? (
          <BoothMarigold viewBox={viewBox.join(' ')} ring={false} />
        ) : hasPortrait(flower.id) ? (
          <FlowerPortrait id={flower.id} />
        ) : (
          <WallFlower tint={flower.tint} size={320} ring={false} />
        )}
        <span className={styles.ring} style={ringBox(viewBox, ring)} aria-hidden="true">
          <svg viewBox={`${ring.cx - ring.r} ${ring.cy - ring.r} ${2 * ring.r} ${2 * ring.r}`}>
            <circle cx={ring.cx} cy={ring.cy} r={ring.r} className="ln-dot" />
          </svg>
        </span>
      </div>
    </div>
  );
}
