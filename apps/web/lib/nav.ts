'use client'

import { useRouter, usePathname } from 'next/navigation'

export type Route = 'home' | 'how' | 'releases'

/** Route key → real Next.js path. */
export const PATHS: Record<Route, string> = {
  home: '/',
  how: '/how-it-works',
  releases: '/releases',
}

/** Navigate by route key — replaces the old hash router's `go`. */
export function useGo(): (r: Route) => void {
  const router = useRouter()
  return (r: Route) => router.push(PATHS[r])
}

/** Current route key, derived from the pathname (for nav highlighting). */
export function useActive(): Route {
  const p = usePathname()
  if (p.startsWith('/how-it-works')) return 'how'
  if (p.startsWith('/releases')) return 'releases'
  return 'home'
}
