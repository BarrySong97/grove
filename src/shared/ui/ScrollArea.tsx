/**
 * @purpose Defines a flex scroll container with hidden native scrollbars.
 * @role    Reusable layout primitive for panel body and settings view.
 * @deps    ReactNode
 * @gotcha  Parent must provide bounded height/flex context; docs/modules/ui/README.md
 */
import type { ReactNode } from 'react'

interface ScrollAreaProps {
  children: ReactNode
  className?: string
}

export function ScrollArea({ children, className = '' }: ScrollAreaProps) {
  return <div className={`no-scrollbar min-h-0 flex-1 overflow-y-auto ${className}`}>{children}</div>
}
