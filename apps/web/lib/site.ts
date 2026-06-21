/**
 * Single source of truth for site-wide SEO metadata.
 *
 * SITE_URL resolution order (every absolute URL — canonical, OG, sitemap,
 * robots, JSON-LD — derives from it):
 *   1. NEXT_PUBLIC_SITE_URL          — explicit override; set this once you
 *                                      bind a custom domain in Vercel.
 *   2. VERCEL_PROJECT_PRODUCTION_URL — Vercel's stable production domain,
 *                                      injected automatically at build/runtime
 *                                      (no protocol, e.g. "grove-xyz.vercel.app").
 *   3. http://localhost:3000         — local dev fallback.
 */
function resolveSiteUrl(): string {
  const override = process.env.NEXT_PUBLIC_SITE_URL
  if (override) return override.replace(/\/$/, '')

  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL
  if (vercel) return `https://${vercel}`

  return 'http://localhost:3000'
}

export const SITE_URL = resolveSiteUrl()

export const SITE = {
  name: 'Grove',
  title: 'Grove — Git worktrees from your menu bar',
  description:
    'Grove turns git worktrees into one-click workspaces. Spin up an isolated checkout for every feature, fix, or AI agent — then switch between them from your menu bar.',
  githubUrl: 'https://github.com/BarrySong97/grove',
} as const
