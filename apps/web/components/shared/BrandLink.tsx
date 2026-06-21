'use client'

import Image from 'next/image'
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
      <Image
        src="/Grove.svg"
        alt=""
        width={markSize}
        height={markSize}
        className="block shrink-0 rounded-[22%]"
      />
      Grove
    </button>
  )
}
