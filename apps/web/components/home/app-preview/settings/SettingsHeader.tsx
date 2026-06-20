import type { ReactNode } from 'react'
import { Dot } from '@grove/ui'

const titleClass = 'text-[length:var(--settings-title-size)] font-semibold tracking-[-0.1px]'

export function SettingsHeader({
  title,
  subtitle,
  dotColor,
  subtitleClassName = '',
  className = 'px-2.5 pb-2.5 pt-2',
}: {
  title: string
  subtitle?: ReactNode
  dotColor?: string
  subtitleClassName?: string
  className?: string
}) {
  return (
    <div className={className}>
      {dotColor ? (
        <div className="flex min-w-0 items-center gap-2">
          <Dot color={dotColor} className="h-2 w-2" />
          <span className={`${titleClass} min-w-0 flex-1 truncate`}>{title}</span>
        </div>
      ) : (
        <span className={`${titleClass} block`}>{title}</span>
      )}
      {subtitle !== undefined && (
        <span
          className={`block truncate pt-[5px] text-[length:var(--settings-meta-size)] leading-none text-black/55 ${subtitleClassName}`}
        >
          {subtitle}
        </span>
      )}
    </div>
  )
}
