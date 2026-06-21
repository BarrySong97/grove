/**
 * @purpose Defines status icon components backed by lucide-react.
 * @role    Shared icon set for loading and transient operation states.
 * @deps    lucide-react
 * @gotcha  Spinner consumers are responsible for animation classes; docs/modules/icons/README.md
 */
import {
  ArrowDownToLine,
  Check as LucideCheck,
  LoaderCircle,
  Plus as LucidePlus,
  type LucideProps
} from 'lucide-react'

export const Check = (props: LucideProps) => <LucideCheck size={13} strokeWidth={2.6} {...props} />

export const Plus = (props: LucideProps) => <LucidePlus size={14} strokeWidth={2.4} {...props} />

export const Spinner = (props: LucideProps) => (
  <LoaderCircle size={13} strokeWidth={2.2} {...props} />
)

export const UpdateDownload = (props: LucideProps) => (
  <ArrowDownToLine size={13} strokeWidth={2.4} {...props} />
)
