import type { CommandDef, CommandId } from './types'

export const COMMANDS: CommandDef[] = [
  { id: 'run', name: 'Run', desc: 'start the worktree', color: '#3aa856' },
  { id: 'setup', name: 'Setup', desc: 'runs after a worktree is created', color: '#2f6fe0' },
  { id: 'archive', name: 'Archive', desc: 'runs before a worktree is removed', color: '#d98a2b' },
]

export const COMMAND_PLACEHOLDERS: Record<CommandId, string> = {
  run: 'npm run dev',
  setup: 'npm install',
  archive: 'rm -rf node_modules',
}
