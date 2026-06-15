/**
 * @purpose Implements Worktree panel pure state transformations.
 * @role    Use-case layer called by the React state hook for reorder and transient command UI.
 * @deps    @dnd-kit/sortable arrayMove, Worktrees domain rules, shared contracts
 * @gotcha  Real git, shell, settings, and archive workflows live in Rust use cases.
 */
import { arrayMove } from '@dnd-kit/sortable'
import type {
  CommandDef,
  Project,
  ProjectCommands,
  Worktree
} from '../../../shared/contracts/worktrees'
import { buildDraftWorktree } from '../domain/worktree-rules'

export type MoveDirection = 'up' | 'down' | 'top'

export function patchWorktree(
  projects: Project[],
  projectId: string,
  worktreeId: string,
  patch: Partial<Worktree>
) {
  return projects.map((project) =>
    project.id !== projectId
      ? project
      : {
          ...project,
          worktrees: project.worktrees.map((worktree) =>
            worktree.id === worktreeId ? { ...worktree, ...patch } : worktree
          )
        }
  )
}

export function updateProjectCommands(
  projects: Project[],
  projectId: string,
  patch: Partial<ProjectCommands>
) {
  return projects.map((project) =>
    project.id !== projectId ? project : { ...project, commands: { ...project.commands, ...patch } }
  )
}

export function reorderProjects(projects: Project[], activeId: string, overId: string) {
  const from = projects.findIndex((project) => project.id === activeId)
  const to = projects.findIndex((project) => project.id === overId)
  if (from === -1 || to === -1) return projects
  return arrayMove(projects, from, to)
}

export function moveProject(projects: Project[], projectId: string, direction: MoveDirection) {
  const from = projects.findIndex((project) => project.id === projectId)
  if (from === -1) return projects
  const to = getMoveTarget(from, projects.length, direction)
  if (to === null) return projects
  return arrayMove(projects, from, to)
}

export function moveWorktree(
  projects: Project[],
  projectId: string,
  worktreeId: string,
  direction: MoveDirection
) {
  return projects.map((project) => {
    if (project.id !== projectId) return project
    const from = project.worktrees.findIndex((worktree) => worktree.id === worktreeId)
    if (from === -1) return project
    const to = getMoveTarget(from, project.worktrees.length, direction)
    if (to === null) return project
    return { ...project, worktrees: arrayMove(project.worktrees, from, to) }
  })
}

export function reorderWorktrees(
  projects: Project[],
  projectId: string,
  activeId: string,
  overId: string
) {
  return projects.map((project) => {
    if (project.id !== projectId) return project
    const from = project.worktrees.findIndex((worktree) => worktree.id === activeId)
    const to = project.worktrees.findIndex((worktree) => worktree.id === overId)
    if (from === -1 || to === -1) return project
    return { ...project, worktrees: arrayMove(project.worktrees, from, to) }
  })
}

export function switchCurrentWorktree(
  projects: Project[],
  worktree: Worktree,
  targetProject: Project
) {
  return projects.map((project) =>
    project.id !== targetProject.id
      ? project
      : {
          ...project,
          worktrees: project.worktrees.map((next) => ({
            ...next,
            current: next.id === worktree.id
          }))
        }
  )
}

export function createWorktreeDraft(
  projects: Project[],
  project: Project,
  name: string,
  base: string,
  id: string
) {
  const worktree = buildDraftWorktree({ project, name, base, id })
  return {
    projects: projects.map((item) =>
      item.id !== project.id ? item : { ...item, worktrees: [...item.worktrees, worktree] }
    ),
    worktree
  }
}

export function markWorktreeArchived(projects: Project[], project: Project, worktree: Worktree) {
  return projects.map((item) =>
    item.id !== project.id
      ? item
      : { ...item, worktrees: item.worktrees.filter((next) => next.id !== worktree.id) }
  )
}

export function getCommandStartPatch(command: CommandDef): Partial<Worktree> | null {
  return command.id === 'setup' ? { status: 'setting-up' } : null
}

export function getCommandCompletePatch(command: CommandDef): Partial<Worktree> | null {
  return command.id === 'setup' ? { status: 'ready' } : null
}

function getMoveTarget(from: number, length: number, direction: MoveDirection) {
  const to = direction === 'top' ? 0 : direction === 'up' ? from - 1 : from + 1
  if (to < 0 || to >= length) return null
  return to
}
