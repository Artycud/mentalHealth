'use client';

import { useId, type CSSProperties, type Ref } from 'react';

/**
 * The one drawing of a heart in User Mode: a soft jelly blob with a highlight
 * that follows its shape and a contact shadow under it. Its colour is `--c`,
 * from the `colour` prop or from any ancestor.
 *
 * No CSS filters anywhere: a drop-shadow or blur on a shape that morphs every
 * frame is repainted every frame, which is what made phones lag. The shadow is a
 * static gradient ellipse, and the highlight reuses the blob's own path with a
 * gradient in its bounding box, so it stays on the blob however it squishes.
 */
export function HeartGlyph({
  pathRef,
  d,
  colour,
  className,
  style,
  shadow = true,
}: {
  pathRef?: Ref<SVGPathElement>;
  /** The first shape, before any loop draws (also the server render). */
  d?: string;
  colour?: string;
  className?: string;
  style?: CSSProperties;
  shadow?: boolean;
}) {
  const id = `hg${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  return (
    <svg
      className={className}
      viewBox="-160 -160 320 320"
      aria-hidden="true"
      style={{ overflow: 'visible', ...(colour ? ({ '--c': colour } as CSSProperties) : null), ...style }}
    >
      <defs>
        <radialGradient id={`${id}-f`} cx="38%" cy="32%" r="75%">
          <stop offset="0%" style={{ stopColor: 'color-mix(in oklab, var(--c) 45%, #FFFFFF)' }} />
          <stop offset="55%" style={{ stopColor: 'var(--c)' }} />
          <stop offset="100%" style={{ stopColor: 'color-mix(in oklab, var(--c) 72%, #8A3D63)' }} />
        </radialGradient>
        <radialGradient id={`${id}-h`} cx="34%" cy="24%" r="30%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.75" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </radialGradient>
        {shadow && (
          <radialGradient id={`${id}-s`}>
            <stop offset="0%" stopColor="#8A3D63" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#8A3D63" stopOpacity="0" />
          </radialGradient>
        )}
        {/* No fill of its own, so each <use> below paints it its own way. */}
        <path id={`${id}-p`} ref={pathRef} d={d} />
      </defs>
      {shadow && <ellipse cx="0" cy="132" rx="92" ry="18" fill={`url(#${id}-s)`} />}
      <use href={`#${id}-p`} fill={`url(#${id}-f)`} />
      <use href={`#${id}-p`} fill={`url(#${id}-h)`} />
    </svg>
  );
}
