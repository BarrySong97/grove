/**
 * @purpose Wraps settings sheet content in the shared compact padding container.
 * @role    Outer container for GlobalSettings, ProjectSettings, and confirm sheets.
 * @deps    ReactNode
 * @gotcha  Pure layout; opaque surface styling comes from the BottomSheet wrapper.
 */
import type { ReactNode } from 'react'

export function SettingsSheet({ children }: { children: ReactNode }) {
  return <div className="p-0.5">{children}</div>
}
