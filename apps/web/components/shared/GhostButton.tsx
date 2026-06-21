'use client'

import { Button } from '@heroui/react/button'
import type { ReactNode } from 'react'
import { type Route, useGo } from '@/lib/nav'

/** Secondary ghost CTA — HeroUI Button restyled to the site's ghost look; routes internally or links out. */
export function GhostButton({
  children,
  route,
  href,
}: {
  children: ReactNode
  route?: Route
  href?: string
}) {
  const go = useGo()
  const onPress = () => {
    if (href) window.location.href = href
    else if (route) go(route)
  }
  return (
    <Button
      variant="secondary"
      size="lg"
      onPress={onPress}
      className="h-auto cursor-pointer gap-2 rounded-[11px] border-[0.5px] border-black/[0.14] bg-white px-6 py-[13px] text-[15.5px] font-semibold -tracking-[0.1px] text-ink shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition hover:-translate-y-px hover:border-black/25 hover:bg-[#fafafa]"
    >
      {children}
    </Button>
  )
}
