/**
 * @purpose Standardizes settings/confirm sheet buttons (tone + inline/block shape).
 * @role    Button primitive for settings footers and choice sheets.
 * @deps    Hero UI Button, ReactNode
 * @gotcha  Hero UI Button stays size="sm"; primary uses accent, danger uses red text.
 */
import { Button } from '@heroui/react/button'
import type { ReactNode } from 'react'

interface SettingsButtonProps {
  children: ReactNode
  tone?: 'default' | 'primary' | 'danger'
  variant?: 'inline' | 'block'
  type?: 'button' | 'submit'
  isDisabled?: boolean
  onPress?: () => void
  className?: string
}

export function SettingsButton({
  children,
  tone = 'default',
  variant = 'inline',
  type = 'button',
  isDisabled,
  onPress,
  className = ''
}: SettingsButtonProps) {
  const shape = variant === 'block' ? 'justify-start px-3 py-2 text-left' : 'px-[14px] py-[6px]'
  const toneClass =
    tone === 'primary'
      ? 'bg-accent text-white disabled:opacity-40'
      : tone === 'danger'
        ? 'text-red-600'
        : ''
  return (
    <Button
      className={`h-auto rounded-[var(--settings-control-radius)] text-[length:var(--settings-label-size)] font-semibold ${shape} ${toneClass} ${className}`}
      isDisabled={isDisabled}
      onPress={onPress}
      size="sm"
      type={type}
      variant={tone === 'primary' ? 'primary' : 'secondary'}
    >
      {children}
    </Button>
  )
}
