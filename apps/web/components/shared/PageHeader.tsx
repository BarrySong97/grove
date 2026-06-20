import type { ReactNode } from 'react'
import { GlowBackdrop } from './GlowBackdrop'

/** Shared page header: eyebrow + headline + subtitle over a glow backdrop. */
export function PageHeader({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string
  title: ReactNode
  children: ReactNode
}) {
  return (
    <header className="relative pb-[30px] pt-[78px]">
      <GlowBackdrop variant="page" className="h-[560px]" />
      <div className="mx-auto max-w-[820px] px-8">
        <span className="eyebrow">{eyebrow}</span>
        <h1 className="mt-4 text-[clamp(36px,5vw,50px)] font-[680] leading-[1.05] -tracking-[1.6px] text-balance">
          {title}
        </h1>
        <p className="mt-5 max-w-[600px] text-[18px] leading-[1.55] text-ink-2 text-pretty">
          {children}
        </p>
      </div>
    </header>
  )
}
