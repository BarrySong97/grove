/**
 * @purpose Provides the glass panel frame, header/body/footer layout, and scroll containment.
 * @role    Shared shell for WorktreePanel primary and nested content.
 * @deps    React Ref/ReactNode, shared ScrollArea
 * @gotcha  Preserve transparent background, window radius, and overflow clipping; scrollRef is forwarded so WorktreePanel can smooth-scroll to a project; design.md
 */
import type { ReactNode, RefObject } from 'react'
import { ScrollArea } from '../../../shared/ui/ScrollArea'

interface PanelShellProps {
  header: ReactNode
  footer: ReactNode
  children: ReactNode
  scrollRef?: RefObject<HTMLDivElement | null>
  style: React.CSSProperties
}

export function PanelShell({ header, footer, children, scrollRef, style }: PanelShellProps) {
  return (
    <div
      onContextMenu={(event) => event.preventDefault()}
      style={style}
      className="glass-surface relative flex h-screen w-screen origin-top animate-panel-in flex-col overflow-hidden rounded-[var(--window-radius)] border-[0.5px] p-1.5 font-sans text-[13.5px] text-[#1c1c1e] antialiased shadow-panel"
    >
      <div className="shrink-0">{header}</div>
      <ScrollArea ref={scrollRef}>{children}</ScrollArea>
      <div className="shrink-0">{footer}</div>
    </div>
  )
}
