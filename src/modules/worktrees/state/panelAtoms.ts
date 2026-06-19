/**
 * @purpose Defines Jotai atoms for Worktree panel UI state and persisted preferences.
 * @role    Frontend-only state store for panel preferences that must not become backend truth.
 * @deps    jotai/utils
 * @gotcha  Persist only UI preferences here; project/workspace data remains Rust-backed via TanStack Query.
 */
import { atomWithStorage, createJSONStorage } from 'jotai/utils'

export type WorktreeOrderByProject = Record<string, string[]>

const storage = createJSONStorage<unknown>(() => window.localStorage)

export const collapsedProjectIdsAtom = atomWithStorage<unknown>(
  'grove.worktrees.collapsedProjectIds',
  [],
  storage,
  { getOnInit: true }
)

export const projectOrderAtom = atomWithStorage<unknown>(
  'grove.worktrees.projectOrder',
  [],
  storage,
  { getOnInit: true }
)

export const worktreeOrderByProjectAtom = atomWithStorage<unknown>(
  'grove.worktrees.worktreeOrderByProject',
  {},
  storage,
  { getOnInit: true }
)

export function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter(isNonEmptyString)
}

export function asWorktreeOrderByProject(value: unknown): WorktreeOrderByProject {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}

  return Object.fromEntries(
    Object.entries(value)
      .filter((entry): entry is [string, unknown[]] => {
        const [projectId, order] = entry
        return isNonEmptyString(projectId) && Array.isArray(order)
      })
      .map(([projectId, order]) => [projectId, order.filter(isNonEmptyString)])
  )
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0
}
