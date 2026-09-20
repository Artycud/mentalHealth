import type { NextConfig } from 'next';

/**
 * Security headers (BRIEF §12), sent by the app itself so they hold wherever it runs.
 *
 * The policy allows this site and nothing else: no third-party scripts, styles, fonts,
 * images or frames, because a mental health page carries no analytics or widgets. The
 * inline allowances are there because Next.js writes small inline scripts and React
 * sets inline styles; without them the page would not run. Development also needs
 * `unsafe-eval` and a websocket for hot reload.
 */
const dev = process.env.NODE_ENV !== 'production';

const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${dev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  `connect-src 'self'${dev ? ' ws: wss:' : ''}`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join('; ');

/** For the panel and the booth screens: never indexed, never cached. */
const private_ = [
  { key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' },
  { key: 'Cache-Control', value: 'no-store' },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: csp },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'no-referrer' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
        ],
      },
      { source: '/admin/:path*', headers: private_ },
      { source: '/api/admin/:path*', headers: private_ },
      { source: '/booth/login', headers: private_ },
    ];
  },
};

export default nextConfig;
