/**
 * @purpose Groups settings rows under a leading divider and uppercase section title.
 * @role    Section wrapper used by GlobalSettings and ProjectSettings.
 * @deps    ReactNode, shared Divider
 * @gotcha  Renders its own top Divider; consumers should not add one before it.
 */
import type { ReactNode } from 'react'
import { Divider } from '../../../../shared/ui/Divider'

interface SettingsSectionProps {
  title?: string
  children: ReactNode
}

export function SettingsSection({ title, children }: SettingsSectionProps) {
  return (
    <>
      <Divider />
      {title && (
        <div className="px-2.5 pb-[3px] pt-[7px] text-[length:var(--settings-meta-size)] font-semibold uppercase tracking-[0.5px] text-black/[0.34]">
          {title}
        </div>
      )}
      {children}
    </>
  )
}
