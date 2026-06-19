/**
 * @purpose Lays out a settings row with inline (label-left) or stacked (label-above) layout, plus aligned help/error.
 * @role    Core row primitive for all settings forms; owns help/error placement.
 * @deps    ReactNode
 * @gotcha  Inline indents help/error to the label column (label 85px / command 63px);
 *          stacked puts the label above a full-width control and aligns help/error to its left edge.
 */
import type { ReactNode } from 'react'

interface SettingsRowProps {
  label?: ReactNode
  labelVariant?: 'label' | 'command'
  layout?: 'inline' | 'stacked'
  align?: 'center' | 'start'
  help?: ReactNode
  error?: ReactNode
  children: ReactNode
}

export function SettingsRow({
  label,
  labelVariant = 'label',
  layout = 'inline',
  align = 'center',
  help,
  error,
  children
}: SettingsRowProps) {
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
        {error && <div className={`${metaClass} text-[#dc2626]`}>{error}</div>}
        {help && <div className={`${metaClass} text-black/[0.22]`}>{help}</div>}
      </div>
    )
  }

  const isCommand = labelVariant === 'command'
  const labelClass = isCommand
    ? 'flex w-[var(--settings-command-label-width)] shrink-0 items-center gap-[7px] text-[length:var(--settings-label-size)] font-semibold text-[#1c1c1e]'
    : 'w-[var(--settings-label-width)] shrink-0 text-[length:var(--settings-label-size)] font-semibold text-[#1c1c1e]'
  // Indent help/error to the control column: command label 56px + 7px gap, standard 78px + 7px gap.
  const metaClass = `pt-[3px] ${isCommand ? 'pl-[63px]' : 'pl-[85px]'} text-[length:var(--settings-meta-size)] leading-[1.3]`
  return (
    <div className="px-2.5 py-1">
      <div
        className={`flex gap-[var(--settings-row-gap)] ${align === 'start' ? 'items-start' : 'items-center'}`}
      >
        <span className={labelClass}>{label}</span>
        {children}
      </div>
      {error && <div className={`${metaClass} text-[#dc2626]`}>{error}</div>}
      {help && <div className={`${metaClass} text-black/[0.22]`}>{help}</div>}
    </div>
  )
}
