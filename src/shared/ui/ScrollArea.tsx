import type { ReactNode } from 'react'

interface ScrollAreaProps {
  children: ReactNode
  className?: string
}

export function ScrollArea({ children, className = '' }: ScrollAreaProps) {
  return <div className={`no-scrollbar min-h-0 flex-1 overflow-y-auto ${className}`}>{children}</div>
}
