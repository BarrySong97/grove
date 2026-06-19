/**
 * @purpose Right-aligns settings/confirm sheet action buttons in a row.
 * @role    Footer layout for settings pages and choice sheets.
 * @deps    ReactNode
 * @gotcha  Default padding suits settings pages; pass className="" for inline sheets.
 */
import type { ReactNode } from 'react'

export function SettingsFooter({
  children,
  className = 'px-1.5 pb-1 pt-2.5'
}: {
  children: ReactNode
  className?: string
}) {
  return <div className={`flex justify-end gap-2 ${className}`}>{children}</div>
}
