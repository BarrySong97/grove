import type { ReactNode } from 'react'

export function SettingsRow({
  label,
  layout = 'inline',
  align = 'center',
  help,
  children,
}: {
  label?: ReactNode
  layout?: 'inline' | 'stacked'
  align?: 'center' | 'start'
  help?: ReactNode
  children: ReactNode
}) {
  if (layout === 'stacked') {
    const metaClass = 'pt-[3px] text-[length:var(--settings-meta-size)] leading-[1.3]'
    return (
      <div className="px-2.5 py-1.5">
        {label !== undefined && (
          <div className="mb-1 flex items-center gap-[7px] text-[length:var(--settings-label-size)] font-semibold text-[#1c1c1e]">
            {label}
          </div>
        )}
        <div className="flex">{children}</div>
        {help && <div className={`${metaClass} text-black/[0.22]`}>{help}</div>}
      </div>
    )
  }

  const labelClass =
    'w-[var(--settings-label-width)] shrink-0 text-[length:var(--settings-label-size)] font-semibold text-[#1c1c1e]'
  const metaClass =
    'pt-[3px] pl-[85px] text-[length:var(--settings-meta-size)] leading-[1.3]'
  return (
    <div className="px-2.5 py-1">
      <div
        className={`flex gap-[var(--settings-row-gap)] ${align === 'start' ? 'items-start' : 'items-center'}`}
      >
        <span className={labelClass}>{label}</span>
        {children}
      </div>
      {help && <div className={`${metaClass} text-black/[0.22]`}>{help}</div>}
    </div>
  )
}
