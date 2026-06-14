import type { Project, Worktree } from './types'

export function isWorktreeBusy(worktree: Worktree) {
  return worktree.status === 'setting-up' || worktree.status === 'archiving'
}

export function getBusyLabel(worktree: Worktree) {
  return worktree.status === 'setting-up' ? 'Running setup…' : 'Archiving…'
}

export function hasWorktreeStatus(worktree: Worktree) {
  return worktree.ahead > 0 || worktree.behind > 0 || worktree.dirty > 0
}

export function getCurrentWorktree(project: Project) {
  return project.worktrees.find((worktree) => worktree.current) ?? project.worktrees[0]
}

export function createDraftWorktree(project: Project, name: string, base: string): Worktree {
  const slug = name.replace(/[^a-z0-9]+/gi, '-')

  return {
    id: `${project.id}-${Date.now()}`,
    branch: name,
    base,
    current: false,
    ahead: 0,
    behind: 0,
    dirty: 0,
    status: 'setting-up',
    time: 'now',
    message: `created from ${base}`,
    path: `${project.id}/.worktrees/${slug}`,
  }
}
