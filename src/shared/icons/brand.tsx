import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

export const GroveIcon = (props: IconProps) => (
  <svg viewBox="0 0 16 16" width="15" height="15" fill="none" {...props}>
    <circle cx="4" cy="3.3" r="1.7" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="4" cy="12.7" r="1.7" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="12" cy="3.3" r="1.7" stroke="currentColor" strokeWidth="1.5" />
    <path
      d="M4 5v6M4 8h4.3c2 0 3.7-1.7 3.7-3.7V5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
)

export const Branch = (props: IconProps) => (
  <svg viewBox="0 0 16 16" width="14" height="14" fill="none" {...props}>
    <circle cx="4" cy="3.3" r="1.9" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="4" cy="12.7" r="1.9" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="12" cy="3.3" r="1.9" stroke="currentColor" strokeWidth="1.5" />
    <path
      d="M4 5.2v5.6M4 8h4.3c2 0 3.7-1.7 3.7-3.7V5.2"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
)
