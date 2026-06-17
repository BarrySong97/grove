/**
 * @purpose Defines Grove brand icon components and brand-adjacent wrappers.
 * @role    Brand icon source for panel header and branch-related UI.
 * @deps    React SVG props pattern, lucide-react
 * @gotcha  Coordinate changes with generated tray icon shape where relevant; docs/modules/icons/README.md
 */
import type { SVGProps } from 'react'
import { GitBranch, type LucideProps } from 'lucide-react'

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

export const Branch = (props: LucideProps) => <GitBranch size={14} strokeWidth={2.1} {...props} />
