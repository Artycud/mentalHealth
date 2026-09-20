import type { MetadataRoute } from 'next';

/** Keeps search engines out of the panel, the booth screens and the API. */
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: '*', disallow: ['/admin', '/booth', '/api'] } };
}
