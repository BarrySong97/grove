import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'

// Public routes to expose to crawlers. Keep in sync with lib/nav.ts.
// Inlined (rather than importing PATHS) because lib/nav.ts is a client module.
const ROUTES: {
  path: string
  changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency']
  priority: number
}[] = [
  { path: '/', changeFrequency: 'monthly', priority: 1 },
  { path: '/releases', changeFrequency: 'weekly', priority: 0.8 },
]

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date()
  return ROUTES.map(({ path, changeFrequency, priority }) => ({
    url: new URL(path, SITE_URL).toString(),
    lastModified,
    changeFrequency,
    priority,
  }))
}
