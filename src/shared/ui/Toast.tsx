import type { ReactNode } from 'react'

interface ToastProps {
  icon?: ReactNode
  children: ReactNode
}

export function Toast({ icon, children }: ToastProps) {
  return (
    <div className="absolute left-3.5 top-10 z-40 flex animate-panel-in items-center gap-2 whitespace-nowrap rounded-[10px] border-[0.5px] border-white/10 bg-[rgba(28,28,32,0.9)] px-3 py-2 text-[12px] font-medium text-white shadow-[0_12px_32px_rgba(0,0,0,0.3)] backdrop-blur-xl">
      {icon}
      <span>{children}</span>
    </div>
  )
}
