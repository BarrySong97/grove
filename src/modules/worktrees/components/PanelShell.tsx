import type { ReactNode } from 'react'
import { ScrollArea } from '../../../shared/ui/ScrollArea'

interface PanelShellProps {
  header: ReactNode
  footer: ReactNode
  children: ReactNode
  style: React.CSSProperties
}

export function PanelShell({ header, footer, children, style }: PanelShellProps) {
  return (
    <div
      onContextMenu={(event) => event.preventDefault()}
      style={style}
      className="glass-surface relative flex h-screen w-screen origin-top animate-panel-in flex-col overflow-hidden rounded-[var(--window-radius)] border-[0.5px] p-1.5 font-sans text-[13.5px] text-[#1c1c1e] antialiased shadow-panel"
    >
      <div className="shrink-0">{header}</div>
      <ScrollArea>{children}</ScrollArea>
      <div className="shrink-0">{footer}</div>
    </div>
  )
}
