/**
 * @purpose Defines Worktree setup/archive command metadata and placeholder strings.
 * @role    Domain catalog consumed by project settings UI.
 * @deps    Shared Worktrees contracts
 * @gotcha  Grove no longer exposes Run Command; setup/archive execute only through backend workflows.
 */
import type { CommandDef, CommandId } from '../../../shared/contracts/worktrees'

export const COMMANDS: CommandDef[] = [
  { id: 'setup', name: 'Setup', desc: 'runs after a worktree is created', color: '#2f6fe0' },
  { id: 'archive', name: 'Archive', desc: 'runs before a worktree is removed', color: '#d98a2b' }
]

export const COMMAND_PLACEHOLDERS: Record<CommandId, string> = {
  setup: 'npm install',
  archive: 'rm -rf node_modules'
}
