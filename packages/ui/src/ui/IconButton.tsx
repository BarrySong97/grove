'use client'

import { useRef, useState } from 'react'
import type { ButtonHTMLAttributes, MouseEvent, ReactNode } from 'react'
import { createPortal } from 'react-dom'

type IconButtonSize = 'project' | 'row'
type IconButtonTone = 'ghost' | 'accent' | 'danger'

const sizeClasses: Record<IconButtonSize, string> = {
  project: 'h-[22px] w-[22px] rounded-md',
  row: 'h-[27px] w-[27px] rounded-[7px]',
}

const toneClasses: Record<IconButtonTone, string> = {
  ghost: 'hover:bg-black/[0.07] hover:text-black/90',
  accent: 'hover:bg-[var(--accent-soft)] hover:text-[var(--accent)]',
  danger: 'hover:bg-red-500/10 hover:text-red-600',
}

/**
 * Icon-only control with a styled tooltip rendered via a portal (so it escapes the
 * panel's overflow clipping). Deliberately avoids HeroUI's Tooltip — its v3
 * Tooltip.Trigger floods the console with "<Focusable> child must be focusable".
 */
export function IconButton({
  title,
  children,
  className = '',
  isDisabled = false,
  size = 'row',
  tone = 'ghost',
  type = 'button',
  onClick,
}: {
  title: string
  children: ReactNode
  className?: string
  isDisabled?: boolean
  size?: IconButtonSize
  tone?: IconButtonTone
  type?: ButtonHTMLAttributes<HTMLButtonElement>['type']
  onClick?: (event: MouseEvent) => void
}) {
  const ref = useRef<HTMLButtonElement>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const [tip, setTip] = useState<{ x: number; y: number } | null>(null)

  const show = () => {
    timer.current = setTimeout(() => {
      const el = ref.current
      if (!el) return
      const r = el.getBoundingClientRect()
      setTip({ x: r.left + r.width / 2, y: r.top })
    }, 350)
  }
  const hide = () => {
    clearTimeout(timer.current)
    setTip(null)
  }

  return (
    <>
      <button
        ref={ref}
        aria-label={title}
        type={type}
        disabled={isDisabled}
        onClick={onClick}
        onMouseEnter={show}
        onMouseLeave={hide}
        onMouseDown={hide}
        className={`grove-icon-scale inline-flex cursor-pointer items-center justify-center p-0 text-black/50 transition-colors ${sizeClasses[size]} ${toneClasses[tone]} ${className}`}
      >
        {children}
      </button>
      {tip &&
        createPortal(
          <div
            role="tooltip"
            style={{ position: 'fixed', left: tip.x, top: tip.y }}
            className="pointer-events-none z-[200] -translate-x-1/2 -translate-y-[calc(100%+6px)] whitespace-nowrap rounded-md border border-black/[0.06] bg-[#1c1c1e] px-2 py-1 text-[10.5px] font-medium leading-none text-white shadow-[0_8px_22px_rgba(0,0,0,0.24)]"
          >
            {title}
          </div>,
          document.body,
        )}
    </>
  )
}
