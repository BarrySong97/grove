'use client'

import type { ReactNode } from 'react'
import { type Route, useGo } from '@/lib/nav'

/** Secondary ghost button — routes internally or links out. Uses .btn (cursor-pointer). */
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
  if (href) {
    return (
      <a href={href} className="btn btn-ghost btn-lg">
        {children}
      </a>
    )
  }
  return (
    <button type="button" onClick={() => route && go(route)} className="btn btn-ghost btn-lg">
      {children}
    </button>
  )
}
