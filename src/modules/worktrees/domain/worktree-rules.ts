/**
 * @purpose Provides pure Worktree domain rules and derived labels.
 * @role    Side-effect-free rule layer used by use cases and row/editor components.
 * @deps    Shared Worktrees contracts
 * @gotcha  Rules must not read filesystem, Tauri APIs, timers, or mock data.
 */
import type { Project, Worktree } from '../../../shared/contracts/worktrees'

export function isWorktreeBusy(worktree: Worktree) {
  return worktree.status === 'setting-up' || worktree.status === 'archiving'
}

export function getBusyLabel(worktree: Worktree) {
  if (worktree.status === 'setting-up') return 'Running setup…'
  if (worktree.status === 'archiving') return 'Archiving…'
  return 'Failed'
}

export function hasWorktreeStatus(worktree: Worktree) {
  return worktree.ahead > 0 || worktree.behind > 0 || worktree.dirty > 0
}

export function getCurrentWorktree(project: Project) {
  return project.worktrees.find((worktree) => worktree.current) ?? project.worktrees[0]
}

export function normalizeWorktreeSlug(name: string) {
  return name.replace(/[^a-z0-9]+/gi, '-')
}

export function buildDraftWorktree({
  project,
  name,
  base,
  id
}: {
  project: Project
  name: string
  base: string
  id: string
}): Worktree {
  return {
    id,
    branch: name,
    base,
    current: false,
    ahead: 0,
    behind: 0,
    dirty: 0,
    status: 'setting-up',
    time: 'now',
    message: `created from ${base}`,
    path: `${project.id}/.worktrees/${normalizeWorktreeSlug(name)}`
  }
}
