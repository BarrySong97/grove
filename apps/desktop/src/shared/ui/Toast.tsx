/**
 * @purpose Renders transient floating feedback inside the panel.
 * @role    Reusable feedback primitive for progress, error, and lightweight notices.
 * @deps    ReactNode, shared Close icon
 * @gotcha  Fills the panel width so long backend errors do not overflow the transparent shell.
 */
import type { ReactNode } from 'react'
import { Close } from '../icons'

interface ToastProps {
  closeLabel?: string
  icon?: ReactNode
  tone?: 'notice' | 'progress' | 'error'
  children: ReactNode
  onClose?: () => void
}

export function Toast({
  closeLabel = 'Close',
  icon,
  tone = 'notice',
  children,
  onClose
}: ToastProps) {
  const toneClass =
    tone === 'error'
      ? 'border-[#ff8a8a]/25 bg-[rgba(82,22,28,0.92)] text-white'
      : 'border-white/10 bg-[rgba(28,28,32,0.9)] text-white'

  return (
    <div
      className={`absolute left-3.5 right-3.5 top-10 z-40 flex animate-panel-in items-start gap-2 rounded-[10px] border-[0.5px] px-3 py-2 text-[12px] font-medium shadow-[0_12px_32px_rgba(0,0,0,0.3)] backdrop-blur-xl ${toneClass}`}
    >
      {icon}
      <span className="min-w-0 flex-1 break-words leading-4">{children}</span>
      {onClose && (
        <button
          aria-label={closeLabel}
          className="grove-icon-scale -mr-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-white/70 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/45"
          type="button"
          onClick={onClose}
        >
          <Close />
        </button>
      )}
    </div>
  )
}
