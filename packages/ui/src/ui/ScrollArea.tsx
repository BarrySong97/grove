import type { ReactNode } from 'react'

export function ScrollArea({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`no-scrollbar min-h-0 flex-1 overflow-y-auto ${className}`}>{children}</div>
}
