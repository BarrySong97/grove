/**
 * @purpose Coordinates WorktreePanel React state, backend commands, and transient feedback.
 * @role    Frontend presentation hook connecting UI events, persisted UI preferences, and Worktrees API/use cases.
 * @deps    React state/effect/ref, Worktrees API/contracts/use-cases, ContextMenu types
 * @gotcha  Add project/global settings delegate to Rust; collapsed project ids stay in localStorage.
 */
import { useEffect, useRef, useState } from 'react'
import type { CommandDef, Project, Worktree } from '../../../shared/contracts/worktrees'
import {
  addProjectFromFolderPicker,
  archiveWorkspace,
  createWorkspace,
  getAppSettings,
  importConductorProjects,
  loadWorktreePanelProjects,
  openWorkspace,
  updateAppSettings,
  updateProjectSettings
} from '../api/groveCommands'
import type { AppSettingsDto, GhosttyOpenModeDto } from '../../../shared/bindings/commands'
import type { OpenWorkspaceTargetDto } from '../../../shared/bindings/commands'
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

const COLLAPSED_PROJECT_IDS_KEY = 'grove.worktrees.collapsedProjectIds'
const DEFAULT_APP_SETTINGS: AppSettingsDto = {
  defaultOpenTarget: 'cursor',
  ghosttyOpenMode: 'window'
}
type ToastTone = 'notice' | 'progress' | 'error'
interface ToastState {
  message: string
  tone: ToastTone
}

export function useWorktreePanelState(initialProjects: Project[] = []) {
  const [projects, setProjects] = useState<Project[]>(initialProjects)
  const [collapsedProjectIds, setCollapsedProjectIds] =
    useState<Set<string>>(readCollapsedProjectIds)
  const [addingTo, setAddingTo] = useState<string | null>(null)
  const [settingsFor, setSettingsFor] = useState<string | null>(null)
  const [globalSettingsOpen, setGlobalSettingsOpen] = useState(false)
  const [appSettings, setAppSettings] = useState<AppSettingsDto>(DEFAULT_APP_SETTINGS)
  const [appSettingsSaving, setAppSettingsSaving] = useState(false)
  const [ctx, setCtx] = useState<ContextState | null>(null)
  const [toast, setToast] = useState<ToastState | null>(null)
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
        if (!cancelled) showToast('Unable to load Grove projects', 'error')
      })

    return () => {
      cancelled = true
    }
  }, [initialProjects.length])

  useEffect(() => {
    let cancelled = false
    void getAppSettings()
      .then((nextSettings) => {
        if (!cancelled) setAppSettings(nextSettings)
      })
      .catch(() => {
        if (!cancelled) showToast('Unable to load Grove settings', 'error')
      })

    return () => {
      cancelled = true
    }
  }, [])

  const after = (ms: number, fn: () => void) => {
    timers.current.push(window.setTimeout(fn, ms))
  }

  const total = projects.reduce((n, project) => n + project.worktrees.length, 0)
  const settingsProject = settingsFor
    ? projects.find((project) => project.id === settingsFor)
    : null

  const patchWorktree = (projectId: string, worktreeId: string, patch: Partial<Worktree>) =>
    setProjects((current) => patchWorktreeUseCase(current, projectId, worktreeId, patch))

  const showToast = (message: string, tone: ToastTone = 'notice') => {
    setToast({ message, tone })
  }

  const clearToast = () => setToast(null)

  const flash = (message: string, ms = 1500) => {
    showToast(message)
    after(ms, () => setToast(null))
  }

  const describeError = (error: unknown, fallback: string) =>
    error instanceof Error && error.message.trim() ? error.message : fallback

  const reorderProjects = (activeId: string, overId: string) =>
    setProjects((current) => reorderProjectsUseCase(current, activeId, overId))

  const moveProject = (projectId: string, direction: 'up' | 'down' | 'top') =>
    setProjects((current) => moveProjectUseCase(current, projectId, direction))

  const moveWorktree = (projectId: string, worktreeId: string, direction: 'up' | 'down' | 'top') =>
    setProjects((current) => moveWorktreeUseCase(current, projectId, worktreeId, direction))

  const setProjectCollapsed = (projectId: string, collapsed: boolean) => {
    setCollapsedProjectIds((current) => {
      const next = new Set(current)
      if (collapsed) {
        next.add(projectId)
      } else {
        next.delete(projectId)
      }
      if (setsEqual(current, next)) return current
      writeCollapsedProjectIds(next)
      return next
    })
  }

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
    showToast(`Create · ${project.name}/${name}`, 'progress')
    void createWorkspace({
      projectId: project.id,
      name,
      branch: name,
      baseBranch: base,
      runSetup: Boolean(project.commands.setup.trim())
    })
      .then(() => reloadProjects())
      .then(() => clearToast())
      .catch((error: unknown) => {
        const fallback = `Create failed · ${project.name}/${name}`
        const detail = describeError(error, fallback)
        void reloadProjects().finally(() => {
          showToast(detail === fallback ? fallback : `${fallback}: ${detail}`, 'error')
        })
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

    showToast(`Archive · ${project.name}/${worktree.branch}`, 'progress')
    patchWorktree(project.id, worktree.id, { status: 'archiving' })
    void archiveWorkspace({
      workspaceId: worktree.id,
      policy,
      rememberPolicy: project.archivePolicy === 'ask'
    })
      .then(() => reloadProjects())
      .then(() => clearToast())
      .catch((error: unknown) => {
        patchWorktree(project.id, worktree.id, { status: 'ready' })
        const fallback = `Archive failed · ${project.name}/${worktree.branch}`
        const detail = describeError(error, fallback)
        showToast(detail === fallback ? fallback : `${fallback}: ${detail}`, 'error')
      })
  }

  const runCommand = (command: CommandDef, worktree: Worktree, project: Project) => {
    showToast(`${command.name} · ${project.name}/${worktree.branch}`, 'progress')
    const startPatch = getCommandStartPatch(command)
    if (startPatch) patchWorktree(project.id, worktree.id, startPatch)
    after(1900, () => {
      const completePatch = getCommandCompletePatch(command)
      if (completePatch) patchWorktree(project.id, worktree.id, completePatch)
      clearToast()
    })
  }

  const addProject = () => {
    void addProjectFromFolderPicker()
      .then((project) => {
        if (!project) return
        showToast('Adding project', 'progress')
        return reloadProjects().then(() => {
          clearToast()
        })
      })
      .catch((error: unknown) => showToast(describeError(error, 'Add project failed'), 'error'))
  }

  const importFromConductor = () => {
    showToast('Importing Conductor workspaces', 'progress')
    void importConductorProjects()
      .then(() => loadWorktreePanelProjects())
      .then((nextProjects) => {
        setProjects(nextProjects)
        clearToast()
      })
      .catch((error: unknown) =>
        showToast(describeError(error, 'Import from Conductor failed'), 'error')
      )
  }

  const saveProjectSettings = (
    projectId: string,
    input: {
      workspaceRoot: string
      archivePolicy: Project['archivePolicy']
      commands: Project['commands']
    }
  ) => {
    showToast('Saving project settings', 'progress')
    void updateProjectSettings({
      projectId,
      workspaceRoot: input.workspaceRoot,
      archivePolicy: input.archivePolicy,
      commands: input.commands
    })
      .then(() => reloadProjects())
      .then(() => {
        setSettingsFor(null)
        clearToast()
      })
      .catch((error: unknown) =>
        showToast(describeError(error, 'Save project settings failed'), 'error')
      )
  }

  const setGhosttyOpenMode = (mode: GhosttyOpenModeDto) => {
    saveAppSettings({ ...appSettings, ghosttyOpenMode: mode })
  }

  const setDefaultOpenTarget = (target: OpenWorkspaceTargetDto) => {
    saveAppSettings({ ...appSettings, defaultOpenTarget: target })
  }

  const saveAppSettings = (next: AppSettingsDto) => {
    const previous = appSettings
    setAppSettings(next)
    setAppSettingsSaving(true)
    void updateAppSettings(next)
      .then((savedSettings) => {
        setAppSettings(savedSettings)
        setAppSettingsSaving(false)
      })
      .catch((error: unknown) => {
        setAppSettings(previous)
        setAppSettingsSaving(false)
        showToast(describeError(error, 'Save app settings failed'), 'error')
      })
  }

  const openWorktree = (worktree: Worktree, project: Project, target: OpenWorkspaceTargetDto) => {
    setCtx(null)
    void openWorkspace(worktree.id, target).catch((error: unknown) =>
      showToast(describeError(error, `Open failed · ${project.name}/${worktree.branch}`), 'error')
    )
  }

  return {
    addingTo,
    addProject,
    appSettings,
    appSettingsSaving,
    archiveWorktree,
    collapsedProjectIds,
    createWorktree,
    ctx,
    flash,
    importFromConductor,
    globalSettingsOpen,
    moveProject,
    moveWorktree,
    openWorktree,
    projects,
    reorderProjects,
    reorderWorktrees,
    runCommand,
    setAddingTo,
    setProjectCollapsed,
    setCtx,
    setDefaultOpenTarget,
    setGhosttyOpenMode,
    setGlobalSettingsOpen,
    setSettingsFor,
    saveProjectSettings,
    settingsProject,
    switchTo,
    toast,
    total
  }
}

function readCollapsedProjectIds() {
  if (typeof window === 'undefined') return new Set<string>()

  try {
    const raw = window.localStorage.getItem(COLLAPSED_PROJECT_IDS_KEY)
    const ids = raw ? JSON.parse(raw) : []
    if (!Array.isArray(ids)) return new Set<string>()
    return new Set(ids.filter((id): id is string => typeof id === 'string' && id.length > 0))
  } catch {
    return new Set<string>()
  }
}

function writeCollapsedProjectIds(ids: Set<string>) {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(COLLAPSED_PROJECT_IDS_KEY, JSON.stringify([...ids]))
  } catch {
    // localStorage can be unavailable in restricted webview contexts; collapse state is non-critical UI state.
  }
}

function setsEqual(left: Set<string>, right: Set<string>) {
  if (left.size !== right.size) return false
  for (const value of left) {
    if (!right.has(value)) return false
  }
  return true
}
