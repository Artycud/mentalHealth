import type { Metadata, Viewport } from 'next';

import './fonts.css';
import './globals.css';
import './festivals/loykrathong.css';
import { ToneFromUrl } from '@/components/heart/ToneFromUrl';
import { common } from '@/content/th/common';
import { DEFAULT_TONE } from '@/lib/tone';

export const metadata: Metadata = {
  title: common.wordmark,
  description: 'เช็กอินความรู้สึกสั้น ๆ กับ CUD Mental Health Week',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  /* Lets the page paint under the notch and home indicator. Everything that
     touches an edge then pads itself with env(safe-area-inset-*) (§6). */
  viewportFit: 'cover',
  /* Paints the iOS status bar area to match the paper background. */
  themeColor: '#FCF1E6',
  colorScheme: 'light',
  /* Deliberately NOT setting userScalable: false — pinch-zoom has to survive
     for accessibility (§13). */
};

/* Preloaded rather than left to font-display: swap, because all four faces are
   above the fold on the home screen and this design is typography-led — a
   visible fallback flash would read as broken.

   Note: no apple-mobile-web-app-capable. Standalone mode removes Safari's back
   button, and §9 requires browser back to step back one question. */
const PRELOAD_FONTS = [
  '/fonts/mitr-600-thai.woff2', // headlines
  '/fonts/mitr-500-thai.woff2', // buttons, section headings
  '/fonts/mitr-500-latin.woff2', // "CUD Mental Health Week" wordmark
  '/fonts/ibm-plex-sans-thai-looped-400-thai.woff2', // body
];

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="th" data-tone={DEFAULT_TONE}>
      <head>
        {PRELOAD_FONTS.map((href) => (
          <link
            key={href}
            rel="preload"
            href={href}
            as="font"
            type="font/woff2"
            crossOrigin="anonymous"
          />
        ))}
      </head>
      <body>
        {children}
        <ToneFromUrl />
      </body>
    </html>
  );
}
