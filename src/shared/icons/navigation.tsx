/**
 * @purpose Defines navigation and ordering SVG icon components.
 * @role    Shared icon set for collapse, back, up/down, and move-to-top controls.
 * @deps    React SVG props pattern
 * @gotcha  Keep icons legible at 16px and 22px button sizes; docs/modules/icons/README.md
 */
import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

export const ChevronRight = (props: IconProps) => (
  <svg viewBox="0 0 16 16" width="13" height="13" fill="none" {...props}>
    <path
      d="M6 3.5 10.5 8 6 12.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

export const ChevronLeft = (props: IconProps) => (
  <svg viewBox="0 0 16 16" width="14" height="14" fill="none" {...props}>
    <path
      d="M10 3.5 5.5 8 10 12.5"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

export const ChevronUp = (props: IconProps) => (
  <svg viewBox="0 0 16 16" width="13" height="13" fill="none" {...props}>
    <path
      d="M3.5 10 8 5.5 12.5 10"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

export const ChevronDown = (props: IconProps) => (
  <svg viewBox="0 0 16 16" width="13" height="13" fill="none" {...props}>
    <path
      d="M3.5 6 8 10.5 12.5 6"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

export const ToTop = (props: IconProps) => (
  <svg viewBox="0 0 16 16" width="13" height="13" fill="none" {...props}>
    <path d="M3.5 3.4h9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path
      d="M8 13V6.4M5 9.4 8 6.3l3 3.1"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)
