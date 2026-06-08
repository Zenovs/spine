import type { MetadataRoute } from 'next';

const BASE = 'https://spine-orpin.vercel.app';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        // Allow all general crawlers on the marketing page; lock out anything
        // user-flow or auth-related so admins / personal content / API routes
        // never appear in search results.
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/admin/',
          '/api/',
          '/q/',           // personal QR content URLs — never indexable
        ],
      },
      {
        // Explicit allow for major AI crawlers so they can read the marketing
        // page and cite us correctly. They get the same disallow list.
        userAgent: ['GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-Web', 'PerplexityBot', 'Google-Extended', 'Applebot-Extended'],
        allow: '/',
        disallow: ['/admin', '/admin/', '/api/', '/q/'],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
    host: BASE,
  };
}
