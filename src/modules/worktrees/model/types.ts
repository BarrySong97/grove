export type WorktreeStatus = 'ready' | 'setting-up' | 'archiving'

export interface Worktree {
  id: string
  branch: string
  base: string | null
  current: boolean
  ahead: number
  behind: number
  dirty: number
  status: WorktreeStatus
  time: string
  message: string
  path: string
}

export interface ProjectCommands {
  run: string
  setup: string
  archive: string
}

export interface Project {
  id: string
  name: string
  path: string
  accent: string
  commands: ProjectCommands
  worktrees: Worktree[]
}

export type Density = 'comfortable' | 'compact'

export type CommandId = keyof ProjectCommands

export interface CommandDef {
  id: CommandId
  name: string
  desc: string
  color: string
}
