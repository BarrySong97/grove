/**
 * @purpose Defines navigation and ordering icon components backed by lucide-react.
 * @role    Shared icon set for collapse, back, up/down, and move-to-top controls.
 * @deps    lucide-react
 * @gotcha  Keep semantic export names stable for consumers; docs/modules/icons/README.md
 */
import {
  ArrowUpToLine,
  ChevronDown as LucideChevronDown,
  ChevronLeft as LucideChevronLeft,
  ChevronRight as LucideChevronRight,
  ChevronUp as LucideChevronUp,
  type LucideProps
} from 'lucide-react'

export const ChevronRight = (props: LucideProps) => (
  <LucideChevronRight size={13} strokeWidth={2.2} {...props} />
)

export const ChevronLeft = (props: LucideProps) => (
  <LucideChevronLeft size={14} strokeWidth={2.2} {...props} />
)

export const ChevronUp = (props: LucideProps) => (
  <LucideChevronUp size={13} strokeWidth={2.2} {...props} />
)

export const ChevronDown = (props: LucideProps) => (
  <LucideChevronDown size={13} strokeWidth={2.2} {...props} />
)

export const ToTop = (props: LucideProps) => (
  <ArrowUpToLine size={13} strokeWidth={2.2} {...props} />
)
