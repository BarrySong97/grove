/**
 * @purpose Defines Worktree, Project, command, and density TypeScript contracts.
 * @role    Shared domain types for Worktrees state, UI components, and model helpers.
 * @deps    TypeScript only
 * @gotcha  Current statuses are prototype states, not a complete backend task model; docs/modules/worktrees/README.md
 */
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
