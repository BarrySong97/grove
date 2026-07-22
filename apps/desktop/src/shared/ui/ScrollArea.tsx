/**
 * @purpose Defines a flex scroll container with hidden native scrollbars.
 * @role    Reusable layout primitive for panel body and settings view.
 * @deps    React forwardRef/ReactNode
 * @gotcha  Parent must provide bounded height/flex context; forwards a ref to the scroll element for custom scrollbars; docs/modules/ui/README.md
 */
import { forwardRef, type ReactNode } from 'react'

interface ScrollAreaProps {
  children: ReactNode
  className?: string
}

export const ScrollArea = forwardRef<HTMLDivElement, ScrollAreaProps>(function ScrollArea(
  { children, className = '' },
  ref
) {
  return (
    <div ref={ref} className={`no-scrollbar min-h-0 flex-1 overflow-y-auto ${className}`}>
      {children}
    </div>
  )
})
