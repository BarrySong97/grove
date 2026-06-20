const GRADIENTS = {
  hero:
    'radial-gradient(70% 60% at 80% 10%, color-mix(in srgb, var(--grn) 16%, transparent) 0%, transparent 60%),' +
    'radial-gradient(60% 55% at 12% 2%, rgba(74,95,166,0.10) 0%, transparent 58%)',
  page:
    'radial-gradient(60% 55% at 82% 6%, color-mix(in srgb, var(--grn) 14%, transparent) 0%, transparent 60%),' +
    'radial-gradient(55% 50% at 10% 0%, rgba(74,95,166,0.08) 0%, transparent 58%)',
} as const

/** Soft radial-gradient glow behind page headers. */
export function GlowBackdrop({
  variant = 'page',
  className = 'h-[560px]',
}: {
  variant?: keyof typeof GRADIENTS
  className?: string
}) {
  return (
    <div
      className={`pointer-events-none absolute inset-x-0 -top-[120px] -z-10 ${className}`}
      style={{ background: GRADIENTS[variant] }}
    />
  )
}
