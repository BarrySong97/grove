// Browser-safe Worktree/Project contracts, shared across apps.
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

export type OpenWorkspaceTarget = 'finder' | 'zed' | 'cursor' | 'vs_code' | 'ghostty' | 'terminal'
