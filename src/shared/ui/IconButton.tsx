/**
 * @purpose Defines fixed-size icon-only buttons for project and row actions.
 * @role    Reusable UI primitive consumed by worktree components.
 * @deps    Hero UI Button/Tooltip, React button props/ReactNode
 * @gotcha  Always provide title text for icon-only controls; docs/modules/ui/README.md
 */
import { Button } from '@heroui/react/button'
import { Tooltip } from '@heroui/react/tooltip'
import type { ButtonHTMLAttributes, MouseEvent, ReactNode } from 'react'

type IconButtonSize = 'project' | 'row'
type IconButtonTone = 'ghost' | 'accent' | 'danger'

interface IconButtonProps {
  title: string
  children: ReactNode
  className?: string
  isDisabled?: boolean
  size?: IconButtonSize
  tone?: IconButtonTone
  type?: ButtonHTMLAttributes<HTMLButtonElement>['type']
  onClick?: (event: MouseEvent) => void
}

const sizeClasses: Record<IconButtonSize, string> = {
  project: 'h-[22px] w-[22px] rounded-md',
  row: 'h-[27px] w-[27px] rounded-[7px]'
}

const toneClasses: Record<IconButtonTone, string> = {
  ghost: 'hover:bg-black/[0.07] hover:text-black/90',
  accent: 'hover:bg-accent-soft hover:text-accent',
  danger: 'hover:bg-red-500/10 hover:text-red-600'
}

export function IconButton({
  title,
  children,
  className = '',
  isDisabled = false,
  size = 'row',
  tone = 'ghost',
  type = 'button',
  onClick
}: IconButtonProps) {
  const titleProps = { title }

  return (
    <Tooltip delay={450}>
      <Tooltip.Trigger>
        <Button
          {...titleProps}
          aria-label={title}
          type={type}
          onClick={onClick}
          isDisabled={isDisabled}
          isIconOnly
          size="sm"
          variant="ghost"
          className={`grove-icon-scale min-w-0 p-0 text-black/50 transition-colors ${sizeClasses[size]} ${toneClasses[tone]} ${className}`}
        >
          {children}
        </Button>
      </Tooltip.Trigger>
      <Tooltip.Content
        offset={5}
        className="rounded-md border border-black/[0.06] bg-[#1c1c1e] px-2 py-1 text-[10.5px] font-medium leading-none text-white shadow-[0_8px_22px_rgba(0,0,0,0.24)]"
      >
        {title}
      </Tooltip.Content>
    </Tooltip>
  )
}
