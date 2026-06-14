import type { MouseEvent, ReactNode } from 'react'

type IconButtonSize = 'project' | 'row'
type IconButtonTone = 'ghost' | 'accent' | 'danger'

interface IconButtonProps {
  title: string
  children: ReactNode
  className?: string
  size?: IconButtonSize
  tone?: IconButtonTone
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void
}

const sizeClasses: Record<IconButtonSize, string> = {
  project: 'h-[22px] w-[22px] rounded-md',
  row: 'h-[27px] w-[27px] rounded-[7px]',
}

const toneClasses: Record<IconButtonTone, string> = {
  ghost: 'hover:bg-black/[0.07] hover:text-black/90',
  accent: 'hover:bg-accent-soft hover:text-accent',
  danger: 'hover:bg-red-500/10 hover:text-red-600',
}

export function IconButton({
  title,
  children,
  className = '',
  size = 'row',
  tone = 'ghost',
  onClick,
}: IconButtonProps) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={`flex items-center justify-center text-black/50 transition-colors ${sizeClasses[size]} ${toneClasses[tone]} ${className}`}
    >
      {children}
    </button>
  )
}
