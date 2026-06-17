/**
 * @purpose Defines native workspace open target labels shared by settings and action sheets.
 * @role    Domain catalog for open-workspace UI choices.
 * @deps    generated OpenWorkspaceTargetDto
 * @gotcha  Keep values aligned with Rust OpenWorkspaceTargetDto; docs/modules/worktrees/README.md
 */
import type { OpenWorkspaceTargetDto } from '../../../shared/bindings/commands'

export const OPEN_TARGET_OPTIONS: Array<{ id: OpenWorkspaceTargetDto; label: string }> = [
  { id: 'finder', label: 'Finder' },
  { id: 'zed', label: 'Zed' },
  { id: 'cursor', label: 'Cursor' },
  { id: 'vs_code', label: 'VS Code' },
  { id: 'ghostty', label: 'Ghostty' },
  { id: 'terminal', label: 'Terminal' }
]

export function openTargetActionLabel(target: OpenWorkspaceTargetDto) {
  if (target === 'finder') return 'Reveal in Finder'
  return `Open in ${openTargetDisplayLabel(target)}`
}

export function openTargetDisplayLabel(target: OpenWorkspaceTargetDto) {
  return OPEN_TARGET_OPTIONS.find((option) => option.id === target)?.label ?? target
}
