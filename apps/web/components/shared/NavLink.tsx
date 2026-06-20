'use client'

import type { ReactNode } from 'react'
import { type Route, useGo } from '@/lib/nav'

const SIZES = { sm: 'text-sm', xs: 'text-[13.5px]' } as const

/** Text navigation link rendered as a real button (or anchor for external hrefs). */
export function NavLink({
  children,
  route,
  href,
  active = false,
  size = 'sm',
  className = '',
}: {
  children: ReactNode
  route?: Route
  href?: string
  active?: boolean
  size?: keyof typeof SIZES
  className?: string
}) {
  const go = useGo()
  const cls =
    `${SIZES[size]} cursor-pointer transition hover:text-ink ` +
    (active ? 'font-[560] text-ink' : 'text-ink-2') +
    (className ? ` ${className}` : '')

  if (href) {
    return (
      <a href={href} className={cls}>
        {children}
      </a>
    )
  }
  return (
    <button type="button" onClick={() => route && go(route)} className={cls}>
      {children}
    </button>
  )
}
