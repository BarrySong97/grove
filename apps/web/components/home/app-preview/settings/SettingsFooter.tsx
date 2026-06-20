import type { ReactNode } from 'react'

export function SettingsFooter({
  children,
  className = 'px-1.5 pb-1 pt-2.5',
}: {
  children: ReactNode
  className?: string
}) {
  return <div className={`flex justify-end gap-2 ${className}`}>{children}</div>
}
