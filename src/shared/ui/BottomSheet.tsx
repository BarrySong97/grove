/**
 * @purpose Defines a reusable motion-powered bottom sheet shell.
 * @role    Shared overlay primitive for worktree actions and settings sheets.
 * @deps    motion/react, ReactNode/effect
 * @gotcha  Consumers provide inner surface styling; docs/modules/ui/README.md
 */
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, type ReactNode } from 'react'

interface BottomSheetProps {
  ariaLabel: string
  children: ReactNode
  className?: string
  /**
   * Elevates the overlay above other open sheets. Use for confirmation sheets
   * that are launched from within another sheet (e.g. remove project, archive)
   * so they surface in front instead of being obscured.
   */
  elevated?: boolean
  isOpen: boolean
  onClose: () => void
}

export function BottomSheet({
  ariaLabel,
  children,
  className = '',
  elevated = false,
  isOpen,
  onClose
}: BottomSheetProps) {
  useEffect(() => {
    if (!isOpen) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [isOpen, onClose])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={`fixed inset-0 flex items-end bg-black/[0.04] px-1.5 pb-1.5 ${elevated ? 'z-[60]' : 'z-50'}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.12 }}
          onMouseDown={onClose}
        >
          <motion.div
            role="dialog"
            aria-label={ariaLabel}
            className={`max-h-[min(82vh,520px)] w-full overflow-y-auto ${className}`}
            initial={{ y: 22, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 18, opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.16, ease: [0.2, 0.9, 0.3, 1] }}
            onMouseDown={(event) => event.stopPropagation()}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
