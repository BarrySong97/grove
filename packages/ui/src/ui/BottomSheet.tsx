'use client'

import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'

interface BottomSheetProps {
  ariaLabel: string
  children: ReactNode
  className?: string
  elevated?: boolean
  maxHeightClassName?: string
  /** 'fixed' covers the viewport (desktop); 'absolute' covers the nearest positioned ancestor (web preview). */
  containment?: 'fixed' | 'absolute'
  isOpen: boolean
  onClose: () => void
}

export function BottomSheet({
  ariaLabel,
  children,
  className = '',
  elevated = false,
  maxHeightClassName = 'max-h-[min(82vh,520px)]',
  containment = 'fixed',
  isOpen,
  onClose,
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
          className={`${containment} inset-0 flex items-end bg-black/[0.04] px-1.5 pb-1.5 ${
            elevated ? 'z-[60]' : 'z-50'
          }`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.12 }}
          onMouseDown={onClose}
        >
          <motion.div
            role="dialog"
            aria-label={ariaLabel}
            className={`${maxHeightClassName} w-full overflow-y-auto ${className}`}
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
