import type { ReactNode } from 'react'
import { Divider } from '@grove/ui'

export function SettingsSection({ title, children }: { title?: string; children: ReactNode }) {
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
