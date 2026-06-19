/**
 * @purpose Renders a settings toggle row with icon, title, help text, and a switch.
 * @role    Boolean-preference row (e.g. Ghostty open-in-tabs) for GlobalSettings.
 * @deps    Hero UI Switch, ReactNode
 * @gotcha  Hero UI Switch must stay size="sm"; icon wrapper keeps grove-icon-scale.
 */
import { Switch } from '@heroui/react/switch'
import type { ReactNode } from 'react'

interface SettingsSwitchRowProps {
  icon: ReactNode
  title: string
  help: string
  ariaLabel: string
  isSelected: boolean
  disabled?: boolean
  onChange: (selected: boolean) => void
}

export function SettingsSwitchRow({
  icon,
  title,
  help,
  ariaLabel,
  isSelected,
  disabled = false,
  onChange
}: SettingsSwitchRowProps) {
  return (
    <div className="px-2.5 py-1">
      <Switch
        aria-label={ariaLabel}
        className="group flex w-full items-center justify-between gap-3 rounded-lg px-0 py-1"
        isDisabled={disabled}
        isSelected={isSelected}
        onChange={onChange}
        size="sm"
      >
        {({ isSelected: selected }) => (
          <>
            <span className="flex min-w-0 items-center gap-2.5">
              <span className="grove-icon-scale flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-md bg-black/[0.04] text-black/45 shadow-[inset_0_0_0_0.5px_rgba(0,0,0,0.08)]">
                {icon}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[length:var(--settings-label-size)] font-semibold text-[#1c1c1e]">
                  {title}
                </span>
                <span className="block truncate pt-[3px] text-[length:var(--settings-meta-size)] leading-[1.25] text-black/[0.34]">
                  {help}
                </span>
              </span>
            </span>
            <Switch.Control
              className={`relative flex h-[18px] w-[32px] shrink-0 items-center rounded-full p-[2px] shadow-[inset_0_0_0_0.5px_rgba(0,0,0,0.12)] transition-colors ${
                selected ? 'bg-accent' : 'bg-black/[0.14]'
              } ${disabled ? 'opacity-55' : ''}`}
            >
              <Switch.Thumb
                className={`block h-[14px] w-[14px] rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.22)] transition-transform ${
                  selected ? 'translate-x-[14px]' : 'translate-x-0'
                }`}
              />
            </Switch.Control>
          </>
        )}
      </Switch>
    </div>
  )
}
