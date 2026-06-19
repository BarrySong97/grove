/**
 * @purpose Defines browser-safe Worktree, Project, setup/archive command, and density contracts.
 * @role    Shared contract layer imported by frontend UI, domain rules, and use cases.
 * @deps    TypeScript only
 * @gotcha  Display statuses are mapped from Rust lifecycle/operation DTOs; backend remains source of truth.
 */
export type WorktreeStatus = 'ready' | 'setting-up' | 'archiving' | 'failed'

export interface Worktree {
  id: string
  branch: string
  base: string | null
  current: boolean
  isDefault: boolean
  ahead: number
  behind: number
  dirty: number
  status: WorktreeStatus
  time: string
  message: string
  path: string
}

export interface ProjectCommands {
  setup: string
  archive: string
}

export interface Project {
  id: string
  name: string
  path: string
  workspaceRoot: string
  defaultBranch: string
  accent: string
  archivePolicy: 'use_global' | 'ask' | 'hide' | 'remove_worktree'
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
