/**
 * @purpose Coordinates WorktreePanel React state, backend commands, and transient feedback.
 * @role    Frontend presentation hook connecting UI events to Worktrees API/use cases.
 * @deps    React state/effect/ref, Worktrees API/contracts/use-cases, ContextMenu types
 * @gotcha  Run command remains a UI-only placeholder; create/archive/open/settings call Rust.
 */
import { useEffect, useRef, useState } from 'react'
import type { CommandDef, Project, Worktree } from '../../../shared/contracts/worktrees'
import {
  archiveWorkspace,
  createWorkspace,
  importConductorProjects,
  loadWorktreePanelProjects,
  openWorkspace,
  updateProjectSettings
} from '../api/groveCommands'
import type { ContextState } from '../components/ContextMenu'
import {
  getCommandCompletePatch,
  getCommandStartPatch,
  moveProject as moveProjectUseCase,
  moveWorktree as moveWorktreeUseCase,
  patchWorktree as patchWorktreeUseCase,
  reorderProjects as reorderProjectsUseCase,
  reorderWorktrees as reorderWorktreesUseCase,
  switchCurrentWorktree
} from '../use-cases/worktree-panel-actions'

export function useWorktreePanelState(initialProjects: Project[] = []) {
  const [projects, setProjects] = useState<Project[]>(initialProjects)
  const [addingTo, setAddingTo] = useState<string | null>(null)
  const [settingsFor, setSettingsFor] = useState<string | null>(null)
  const [ctx, setCtx] = useState<ContextState | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const timers = useRef<number[]>([])

  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  useEffect(() => {
    if (initialProjects.length > 0) return

    let cancelled = false
    void loadWorktreePanelProjects()
      .then((nextProjects) => {
        if (!cancelled) setProjects(nextProjects)
      })
      .catch(() => {
        if (!cancelled) setToast('Unable to load Grove projects')
      })

    return () => {
      cancelled = true
    }
  }, [initialProjects.length])

  const after = (ms: number, fn: () => void) => {
    timers.current.push(window.setTimeout(fn, ms))
  }

  const total = projects.reduce((n, project) => n + project.worktrees.length, 0)
  const settingsProject = settingsFor
    ? projects.find((project) => project.id === settingsFor)
    : null

  const patchWorktree = (projectId: string, worktreeId: string, patch: Partial<Worktree>) =>
    setProjects((current) => patchWorktreeUseCase(current, projectId, worktreeId, patch))

  const flash = (message: string, ms = 1500) => {
    setToast(message)
    after(ms, () => setToast(null))
  }

  const reorderProjects = (activeId: string, overId: string) =>
    setProjects((current) => reorderProjectsUseCase(current, activeId, overId))

  const moveProject = (projectId: string, direction: 'up' | 'down' | 'top') =>
    setProjects((current) => moveProjectUseCase(current, projectId, direction))

  const moveWorktree = (projectId: string, worktreeId: string, direction: 'up' | 'down' | 'top') =>
    setProjects((current) => moveWorktreeUseCase(current, projectId, worktreeId, direction))

  const reorderWorktrees = (projectId: string, activeId: string, overId: string) =>
    setProjects((current) => reorderWorktreesUseCase(current, projectId, activeId, overId))

  const switchTo = (worktree: Worktree, project: Project) =>
    setProjects((current) => switchCurrentWorktree(current, worktree, project))

  const reloadProjects = () =>
    loadWorktreePanelProjects().then((nextProjects) => {
      setProjects(nextProjects)
      return nextProjects
    })

  const createWorktree = (project: Project, name: string, base: string) => {
    setAddingTo(null)
    setToast(`Setup · ${project.name}/${name}`)
    void createWorkspace({
      projectId: project.id,
      name,
      branch: name,
      baseBranch: base,
      runSetup: Boolean(project.commands.setup.trim())
    })
      .then(() => reloadProjects())
      .then(() => setToast(null))
      .catch(() => {
        setToast(`Setup failed · ${project.name}/${name}`)
      })
  }

  const archiveWorktree = (worktree: Worktree, project: Project) => {
    setCtx(null)
    const policy =
      project.archivePolicy === 'ask'
        ? window.confirm(
            'Remove this git worktree directory after archive succeeds? Cancel keeps it hidden in Grove only.'
          )
          ? 'remove_worktree'
          : 'hide'
        : project.archivePolicy

    setToast(`Archive · ${project.name}/${worktree.branch}`)
    patchWorktree(project.id, worktree.id, { status: 'archiving' })
    void archiveWorkspace({
      workspaceId: worktree.id,
      policy,
      rememberPolicy: project.archivePolicy === 'ask'
    })
      .then(() => reloadProjects())
      .then(() => setToast(null))
      .catch(() => {
        patchWorktree(project.id, worktree.id, { status: 'ready' })
        setToast(`Archive failed · ${project.name}/${worktree.branch}`)
      })
  }

  const runCommand = (command: CommandDef, worktree: Worktree, project: Project) => {
    setToast(`${command.name} · ${project.name}/${worktree.branch}`)
    const startPatch = getCommandStartPatch(command)
    if (startPatch) patchWorktree(project.id, worktree.id, startPatch)
    after(1900, () => {
      const completePatch = getCommandCompletePatch(command)
      if (completePatch) patchWorktree(project.id, worktree.id, completePatch)
      setToast(null)
    })
  }

  const importFromConductor = () => {
    setToast('Importing Conductor workspaces')
    void importConductorProjects()
      .then(() => loadWorktreePanelProjects())
      .then((nextProjects) => {
        setProjects(nextProjects)
        setToast(null)
      })
      .catch(() => setToast('Import from Conductor failed'))
  }

  const saveProjectSettings = (
    projectId: string,
    input: {
      workspaceRoot: string
      archivePolicy: Project['archivePolicy']
      commands: Project['commands']
    }
  ) => {
    setToast('Saving project settings')
    void updateProjectSettings({
      projectId,
      workspaceRoot: input.workspaceRoot,
      archivePolicy: input.archivePolicy,
      commands: input.commands
    })
      .then(() => reloadProjects())
      .then(() => {
        setSettingsFor(null)
        setToast(null)
      })
      .catch(() => setToast('Save project settings failed'))
  }

  const openWorktree = (
    worktree: Worktree,
    project: Project,
    target: 'finder' | 'zed' | 'cursor' | 'vs_code' | 'ghostty' | 'terminal'
  ) => {
    setCtx(null)
    void openWorkspace(worktree.id, target).catch(() =>
      setToast(`Open failed · ${project.name}/${worktree.branch}`)
    )
  }

  return {
    addingTo,
    archiveWorktree,
    createWorktree,
    ctx,
    flash,
    importFromConductor,
    moveProject,
    moveWorktree,
    openWorktree,
    projects,
    reorderProjects,
    reorderWorktrees,
    runCommand,
    setAddingTo,
    setCtx,
    setSettingsFor,
    saveProjectSettings,
    settingsProject,
    switchTo,
    toast,
    total
  }
}
