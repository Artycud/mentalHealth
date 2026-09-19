/**
 * The hand-cut paper look, shared by every illustration.
 *
 * A shape is a piece of coloured paper laid on the page: a soft edge of shadow
 * beneath it (its thickness), the ink itself, and sparse flecks of bare paper showing
 * through the ink like an uneven print. This replaces the old technical marks
 * (offset outlines, halftone dots, crosshairs), which read as a tech poster.
 *
 * Grain never goes behind text, so only shapes use it.
 */

/** The shadow under a piece of paper. Navy at low strength, so it is warm not grey. */
export const PAPER_SHADOW = 'rgba(27, 43, 94, 0.1)';

/** A circle as a path, so a circle and a blob can share one drawing routine. */
export function circlePath(cx: number, cy: number, r: number): string {
  return `M${cx - r} ${cy} a${r} ${r} 0 1 0 ${2 * r} 0 a${r} ${r} 0 1 0 ${-2 * r} 0 Z`;
}

/**
 * The speckle as an SVG pattern. `id` must be unique on the page, because a pattern
 * id is global to the document. `size` is the tile in the drawing's own units: it
 * keeps the flecks about the same size on screen however much a drawing is scaled.
 */
export function SpeckleDefs({ id, size = 192 }: { id: string; size?: number }) {
  return (
    <defs>
      <pattern id={id} patternUnits="userSpaceOnUse" width={size} height={size}>
        <image href="/textures/ink-speckle.png" width={size} height={size} />
      </pattern>
    </defs>
  );
}

/**
 * One piece of cut paper: shadow, ink, flecks. Give it the id of a SpeckleDefs on the
 * same svg to get the flecks; leave it out for a small shape that should stay clean.
 * `mul` multiplies the ink into whatever is under it, so overlapping inks still make
 * a third colour (BRIEF §6).
 */
export function Cut({
  d,
  fill,
  speckle,
  mul = false,
  shadow = true,
  transform,
  className,
}: {
  d: string;
  fill: string;
  speckle?: string;
  mul?: boolean;
  shadow?: boolean;
  transform?: string;
  className?: string;
}) {
  return (
    <g transform={transform} className={className}>
      {shadow && <path d={d} fill={PAPER_SHADOW} transform="translate(5 6)" />}
      <path d={d} fill={fill} className={mul ? 'mul' : undefined} />
      {speckle && <path d={d} fill={`url(#${speckle})`} />}
    </g>
  );
}
