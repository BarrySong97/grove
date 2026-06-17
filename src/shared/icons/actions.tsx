/**
 * @purpose Defines action-oriented icon components backed by lucide-react.
 * @role    Shared icon set for menus, buttons, and worktree row actions.
 * @deps    lucide-react
 * @gotcha  Keep semantic export names stable for consumers; docs/modules/icons/README.md
 */
import {
  Archive as LucideArchive,
  Copy as LucideCopy,
  Folder as LucideFolder,
  Import as LucideImport,
  LogOut,
  MoreHorizontal,
  Play as LucidePlay,
  Settings,
  SquareCode,
  Terminal as LucideTerminal,
  type LucideProps
} from 'lucide-react'

export const Play = (props: LucideProps) => <LucidePlay size={14} strokeWidth={2} {...props} />

export const Editor = (props: LucideProps) => <SquareCode size={15} strokeWidth={2} {...props} />

export const Terminal = (props: LucideProps) => (
  <LucideTerminal size={15} strokeWidth={2} {...props} />
)

export const More = (props: LucideProps) => <MoreHorizontal size={15} strokeWidth={2} {...props} />

export const Finder = (props: LucideProps) => <LucideFolder size={14} strokeWidth={2} {...props} />

export const Archive = (props: LucideProps) => (
  <LucideArchive size={14} strokeWidth={2} {...props} />
)

export const Gear = (props: LucideProps) => <Settings size={14} strokeWidth={2} {...props} />

export const Copy = (props: LucideProps) => <LucideCopy size={14} strokeWidth={2} {...props} />

export const Import = (props: LucideProps) => <LucideImport size={14} strokeWidth={2} {...props} />

export const Quit = (props: LucideProps) => <LogOut size={14} strokeWidth={2} {...props} />
