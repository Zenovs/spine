import type { MetadataRoute } from 'next';

const BASE = 'https://www.augmentedreality.ch';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    {
      url: `${BASE}/`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 1.0,
    },
  ];
}
