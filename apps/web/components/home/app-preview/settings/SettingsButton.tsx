'use client'

import { Button } from '@heroui/react/button'
import type { ReactNode } from 'react'

export function SettingsButton({
  children,
  tone = 'default',
  type = 'button',
  onPress,
}: {
  children: ReactNode
  tone?: 'default' | 'primary' | 'danger'
  type?: 'button' | 'submit'
  onPress?: () => void
}) {
  const toneClass =
    tone === 'primary'
      ? 'bg-[var(--accent)] text-white disabled:opacity-40'
      : tone === 'danger'
        ? 'text-red-600'
        : ''
  return (
    <Button
      className={`h-auto cursor-pointer rounded-[var(--settings-control-radius)] px-[14px] py-[6px] text-[length:var(--settings-label-size)] font-semibold ${toneClass}`}
      onPress={onPress}
      size="sm"
      type={type}
      variant={tone === 'primary' ? 'primary' : 'secondary'}
    >
      {children}
    </Button>
  )
}
