import { encodeQr } from '@/lib/qr';

import styles from './QrCode.module.css';

/**
 * A QR code as inline SVG (BRIEF §2: illustrations are inline SVG, no image files),
 * from the booth's own encoder in lib/qr.ts.
 *
 * Dark ink on a white card with the standard four-module quiet zone, because a
 * camera needs the contrast and the margin more than the design needs the paper
 * colour. Each row of dark modules is one path segment, so even a version 6 code
 * is a single small <path>. crispEdges keeps neighbouring modules from showing
 * hairline gaps on a TV that scales the page.
 */
export function QrCode({ value, label, className }: { value: string; label: string; className?: string }) {
  const modules = encodeQr(value);
  const quiet = 4;
  const size = modules.length + quiet * 2;

  let d = '';
  modules.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      if (!row[x]) {
        x += 1;
        continue;
      }
      const start = x;
      while (x < row.length && row[x]) x += 1;
      d += `M${start + quiet} ${y + quiet}h${x - start}v1h${start - x}z`;
    }
  });

  return (
    <svg
      className={`${styles.qr} ${className ?? ''}`}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={label}
      shapeRendering="crispEdges"
    >
      <rect width={size} height={size} fill="#FFFFFF" />
      <path d={d} fill="#1B2B5E" />
    </svg>
  );
}
