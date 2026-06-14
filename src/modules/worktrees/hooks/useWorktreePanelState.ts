/**
 * @purpose Owns in-memory WorktreePanel state transitions and simulated async actions.
 * @role    Feature hook connecting model helpers to panel components and menus.
 * @deps    React state/effect/ref, @dnd-kit/sortable, Worktrees model, ContextMenu types
 * @gotcha  Timers simulate setup/archive/run flows; clear timers on unmount; docs/modules/worktrees/README.md
 */
import { useEffect, useRef, useState } from 'react'
import { arrayMove } from '@dnd-kit/sortable'
import { INITIAL_PROJECTS, createDraftWorktree } from '../model'
import type { CommandDef, Project, ProjectCommands, Worktree } from '../model'
import type { ContextState } from '../components/ContextMenu'

export function useWorktreePanelState(initialProjects: Project[] = INITIAL_PROJECTS) {
  const [projects, setProjects] = useState<Project[]>(initialProjects)
  const [addingTo, setAddingTo] = useState<string | null>(null)
  const [settingsFor, setSettingsFor] = useState<string | null>(null)
  const [ctx, setCtx] = useState<ContextState | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const timers = useRef<number[]>([])

  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  const after = (ms: number, fn: () => void) => {
    timers.current.push(window.setTimeout(fn, ms))
  }

  const total = projects.reduce((n, project) => n + project.worktrees.length, 0)
  const settingsProject = settingsFor ? projects.find((project) => project.id === settingsFor) : null

  const patchWorktree = (projectId: string, worktreeId: string, patch: Partial<Worktree>) =>
    setProjects((current) =>
      current.map((project) =>
        project.id !== projectId
          ? project
          : {
              ...project,
              worktrees: project.worktrees.map((worktree) =>
                worktree.id === worktreeId ? { ...worktree, ...patch } : worktree,
              ),
            },
      ),
    )

  const flash = (message: string, ms = 1500) => {
    setToast(message)
    after(ms, () => setToast(null))
  }

  const setCommands = (projectId: string, patch: Partial<ProjectCommands>) =>
    setProjects((current) =>
      current.map((project) =>
        project.id !== projectId ? project : { ...project, commands: { ...project.commands, ...patch } },
      ),
    )

  const reorderProjects = (activeId: string, overId: string) =>
    setProjects((current) => {
      const from = current.findIndex((project) => project.id === activeId)
      const to = current.findIndex((project) => project.id === overId)
      if (from === -1 || to === -1) return current
      return arrayMove(current, from, to)
    })

  const moveProject = (projectId: string, direction: 'up' | 'down' | 'top') =>
    setProjects((current) => {
      const from = current.findIndex((project) => project.id === projectId)
      if (from === -1) return current
      const to = direction === 'top' ? 0 : direction === 'up' ? from - 1 : from + 1
      if (to < 0 || to >= current.length) return current
      return arrayMove(current, from, to)
    })

  const moveWorktree = (projectId: string, worktreeId: string, direction: 'up' | 'down' | 'top') =>
    setProjects((current) =>
      current.map((project) => {
        if (project.id !== projectId) return project
        const from = project.worktrees.findIndex((worktree) => worktree.id === worktreeId)
        if (from === -1) return project
        const to = direction === 'top' ? 0 : direction === 'up' ? from - 1 : from + 1
        if (to < 0 || to >= project.worktrees.length) return project
        return { ...project, worktrees: arrayMove(project.worktrees, from, to) }
      }),
    )

  const reorderWorktrees = (projectId: string, activeId: string, overId: string) =>
    setProjects((current) =>
      current.map((project) => {
        if (project.id !== projectId) return project
        const from = project.worktrees.findIndex((worktree) => worktree.id === activeId)
        const to = project.worktrees.findIndex((worktree) => worktree.id === overId)
        if (from === -1 || to === -1) return project
        return { ...project, worktrees: arrayMove(project.worktrees, from, to) }
      }),
    )

  const switchTo = (worktree: Worktree, project: Project) =>
    setProjects((current) =>
      current.map((item) =>
        item.id !== project.id
          ? item
          : { ...item, worktrees: item.worktrees.map((next) => ({ ...next, current: next.id === worktree.id })) },
      ),
    )

  const createWorktree = (project: Project, name: string, base: string) => {
    const newWorktree = createDraftWorktree(project, name, base)

    setProjects((current) =>
      current.map((item) =>
        item.id !== project.id ? item : { ...item, worktrees: [...item.worktrees, newWorktree] },
      ),
    )
    setAddingTo(null)
    setToast(`Setup · ${project.name}/${name}`)
    after(2600, () => {
      patchWorktree(project.id, newWorktree.id, {
        status: 'ready',
        message: `branched from ${newWorktree.base}`,
      })
      setToast(null)
    })
  }

  const archiveWorktree = (worktree: Worktree, project: Project) => {
    setCtx(null)
    patchWorktree(project.id, worktree.id, { status: 'archiving' })
    setToast(`Archive · ${project.name}/${worktree.branch}`)
    after(1700, () => {
      setProjects((current) =>
        current.map((item) =>
          item.id !== project.id
            ? item
            : { ...item, worktrees: item.worktrees.filter((next) => next.id !== worktree.id) },
        ),
      )
      setToast(null)
    })
  }

  const runCommand = (command: CommandDef, worktree: Worktree, project: Project) => {
    setToast(`${command.name} · ${project.name}/${worktree.branch}`)
    if (command.id === 'setup') patchWorktree(project.id, worktree.id, { status: 'setting-up' })
    after(1900, () => {
      if (command.id === 'setup') patchWorktree(project.id, worktree.id, { status: 'ready' })
      setToast(null)
    })
  }

  return {
    addingTo,
    archiveWorktree,
    createWorktree,
    ctx,
    flash,
    moveProject,
    moveWorktree,
    projects,
    reorderProjects,
    reorderWorktrees,
    runCommand,
    setAddingTo,
    setCommands,
    setCtx,
    setSettingsFor,
    settingsProject,
    switchTo,
    toast,
    total,
  }
}
