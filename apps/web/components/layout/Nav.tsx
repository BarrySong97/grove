'use client'

// @refresh reset

import { useEffect, useState } from 'react'
import { type Route, useActive } from '@/lib/nav'
import { BrandLink } from '@/components/shared/BrandLink'
import { NavLink } from '@/components/shared/NavLink'
import { DownloadButton } from '@/components/shared/DownloadButton'
import { SITE } from '@/lib/site'

const LINKS: { label: string; route: Route }[] = [
  { label: 'Release notes', route: 'releases' },
]
const DESKTOP_MEDIA_QUERY = '(min-width: 1024px)'

export function Nav() {
  const active = useActive()
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const mediaQuery = window.matchMedia(DESKTOP_MEDIA_QUERY)
    const onScroll = () => setScrolled(active !== 'home' || !mediaQuery.matches ? window.scrollY > 12 : false)
    const onResize = () => onScroll()

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    mediaQuery.addEventListener('change', onResize)
    return () => {
      window.removeEventListener('scroll', onScroll)
      mediaQuery.removeEventListener('change', onResize)
    }
  }, [active])

  return (
    <nav
      className={
        'sticky top-0 z-[100] border-b-[0.5px] transition-[background,border-color,backdrop-filter] duration-300 ' +
        (scrolled
          ? 'border-black/[0.09] bg-canvas/[0.78] backdrop-blur-xl backdrop-saturate-150'
          : 'border-transparent bg-transparent')
      }
    >
      <div className="mx-auto flex h-[62px] max-w-[1140px] items-center gap-7 px-8">
        <BrandLink markSize={30} className="text-[17px] font-[650] -tracking-[0.2px]" />
        <div className="ml-2 hidden items-center gap-[26px] sm:flex">
          {LINKS.map((l) => (
            <NavLink key={l.label} route={l.route} active={active === l.route}>
              {l.label}
            </NavLink>
          ))}
        </div>
        <span className="flex-1" />
        <NavLink href={SITE.githubUrl} className="hidden sm:inline">
          GitHub
        </NavLink>
        <DownloadButton size="sm" />
      </div>
    </nav>
  )
}
