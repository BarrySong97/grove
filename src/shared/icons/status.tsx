/**
 * @purpose Defines status SVG icon components.
 * @role    Shared icon set for loading and transient operation states.
 * @deps    React SVG props pattern
 * @gotcha  Spinner consumers are responsible for animation classes; docs/modules/icons/README.md
 */
import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

export const Check = (props: IconProps) => (
  <svg viewBox="0 0 16 16" width="13" height="13" fill="none" {...props}>
    <path
      d="M3 8.2 6 11.2l7-7.4"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

export const Plus = (props: IconProps) => (
  <svg viewBox="0 0 16 16" width="14" height="14" fill="none" {...props}>
    <path d="M8 3.4v9.2M3.4 8h9.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
)

export const Spinner = (props: IconProps) => (
  <svg viewBox="0 0 16 16" width="13" height="13" fill="none" {...props}>
    <circle cx="8" cy="8" r="5.6" stroke="currentColor" strokeOpacity="0.25" strokeWidth="1.7" />
    <path
      d="M8 2.4A5.6 5.6 0 0 1 13.6 8"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
    />
  </svg>
)
