'use client'

import { GroveMark } from '@/lib/icons'
import { useGo } from '@/lib/nav'

/** Clickable Grove wordmark (logo + name) that routes home. */
export function BrandLink({
  markSize = 30,
  className = '',
}: {
  markSize?: number
  className?: string
}) {
  const go = useGo()
  return (
    <button
      type="button"
      onClick={() => go('home')}
      className={'flex cursor-pointer items-center gap-[11px] ' + className}
    >
      <GroveMark size={markSize} /> Grove
    </button>
  )
}
