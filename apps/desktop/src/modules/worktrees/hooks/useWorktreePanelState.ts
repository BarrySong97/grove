/**
 * @purpose Coordinates WorktreePanel React state, backend queries/mutations, and transient feedback.
 * @role    Frontend presentation hook connecting UI events, persisted UI atoms, and Rust-backed query APIs.
 * @deps    React state/effect/ref, TanStack Query, Jotai atoms, Worktrees API/contracts/use-cases
 * @gotcha  Rust/SQLite/git remain authoritative; Jotai storage is only for UI preferences.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAtom } from 'jotai'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Project, Worktree } from '../../../shared/contracts/worktrees'
import {
  addProjectFromFolderPicker,
  archiveWorkspace,
  createWorkspace,
  getLatestOperation,
  getAppSettings,
  importConductorProjects,
  loadWorktreePanelProjects,
  openWorkspace,
  readOperationLog,
  removeProject,
  retryWorkspaceOperation,
  updateAppSettings,
  updateProjectSettings
} from '../api/groveCommands'
import { worktreeQueryKeys } from '../api/queryKeys'
import type {
  AppLanguageDto,
  AppSettingsDto,
  ArchivePolicyChoiceDto,
  ArchivePolicyDto,
  NewProjectPositionDto
} from '../../../shared/bindings/commands'
import type {
  OpenWorkspaceTargetDto,
  RemoveProjectBehaviorDto
} from '../../../shared/bindings/commands'
import type { ContextState } from '../components/ContextMenu'
import { applyAppLanguage } from '../../../shared/i18n/language'
import {
  moveProject as moveProjectUseCase,
  moveWorktree as moveWorktreeUseCase,
  patchWorktree as patchWorktreeUseCase,
  reorderProjects as reorderProjectsUseCase,
  reorderWorktrees as reorderWorktreesUseCase,
  switchCurrentWorktree
} from '../use-cases/worktree-panel-actions'
import {
  asStringArray,
  asWorktreeOrderByProject,
  collapsedProjectIdsAtom,
  onboardingCompletedAtom,
  projectOrderAtom,
  worktreeOrderByProjectAtom
} from '../state/panelAtoms'

const TOAST_AUTO_DISMISS_MS = 5000
const DEFAULT_APP_SETTINGS: AppSettingsDto = {
  language: 'system',
  hoverQuickOpenTargets: ['cursor', 'terminal'],
  defaultArchivePolicy: 'ask',
  removeProjectBehavior: 'grove_only',
  newProjectPosition: 'first'
}
type ToastTone = 'notice' | 'progress' | 'error'
interface ToastState {
  id: number
  message: string
  tone: ToastTone
}
interface ArchivePromptState {
  project: Project
  worktree: Worktree
}
interface RemoveProjectPromptState {
  project: Project
}
interface LogViewerState {
  title: string
  content: string
}

export function useWorktreePanelState(initialProjects: Project[] = []) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [rawCollapsedProjectIds, setRawCollapsedProjectIds] = useAtom(collapsedProjectIdsAtom)
  const [rawProjectOrder, setRawProjectOrder] = useAtom(projectOrderAtom)
  const [rawWorktreeOrderByProject, setRawWorktreeOrderByProject] = useAtom(
    worktreeOrderByProjectAtom
  )
  const [onboardingCompleted, setOnboardingCompleted] = useAtom(onboardingCompletedAtom)
  const projectOrder = useMemo(() => asStringArray(rawProjectOrder), [rawProjectOrder])
  const worktreeOrderByProject = useMemo(
    () => asWorktreeOrderByProject(rawWorktreeOrderByProject),
    [rawWorktreeOrderByProject]
  )
  const collapsedProjectIds = useMemo(
    () => new Set(asStringArray(rawCollapsedProjectIds)),
    [rawCollapsedProjectIds]
  )
  const hasInitialProjects = initialProjects.length > 0

  const projectsQuery = useQuery({
    queryKey: worktreeQueryKeys.projects,
    queryFn: loadWorktreePanelProjects,
    enabled: !hasInitialProjects,
    initialData: hasInitialProjects ? initialProjects : undefined
  })
  const appSettingsQuery = useQuery({
    queryKey: worktreeQueryKeys.appSettings,
    queryFn: getAppSettings,
    initialData: DEFAULT_APP_SETTINGS
  })
  const appSettings = appSettingsQuery.data ?? DEFAULT_APP_SETTINGS
  const projects = useMemo(
    () =>
      applySortOrder(
        projectsQuery.data ?? [],
        projectOrder,
        worktreeOrderByProject,
        appSettings.newProjectPosition
      ),
    [appSettings.newProjectPosition, projectOrder, projectsQuery.data, worktreeOrderByProject]
  )

  const [addingTo, setAddingTo] = useState<string | null>(null)
  const [settingsFor, setSettingsFor] = useState<string | null>(null)
  const [globalSettingsOpen, setGlobalSettingsOpen] = useState(false)
  const [ctx, setCtx] = useState<ContextState | null>(null)
  const [toast, setToast] = useState<ToastState | null>(null)
  const [archivePrompt, setArchivePrompt] = useState<ArchivePromptState | null>(null)
  const [removeProjectPrompt, setRemoveProjectPrompt] = useState<RemoveProjectPromptState | null>(
    null
  )
  const [logViewer, setLogViewer] = useState<LogViewerState | null>(null)
  const timers = useRef<number[]>([])
  const toastId = useRef(0)
  const projectsLoadErrorShown = useRef(false)
  const settingsLoadErrorShown = useRef(false)

  const after = (ms: number, fn: () => void) => {
    timers.current.push(window.setTimeout(fn, ms))
  }

  const showToast = (message: string, tone: ToastTone = 'notice') => {
    const id = toastId.current + 1
    toastId.current = id
    setToast({ id, message, tone })
    if (tone !== 'progress') {
      after(TOAST_AUTO_DISMISS_MS, () => {
        setToast((current) => (current?.id === id ? null : current))
      })
    }
  }

  const clearToast = () => {
    toastId.current += 1
    setToast(null)
  }

  const describeError = (error: unknown, fallback: string) =>
    error instanceof Error && error.message.trim() ? error.message : fallback

  const reloadProjects = () =>
    queryClient.fetchQuery({
      queryKey: worktreeQueryKeys.projects,
      queryFn: loadWorktreePanelProjects
    })

  const patchWorktree = (projectId: string, worktreeId: string, patch: Partial<Worktree>) =>
    queryClient.setQueryData<Project[]>(worktreeQueryKeys.projects, (current) =>
      current ? patchWorktreeUseCase(current, projectId, worktreeId, patch) : current
    )

  const createWorkspaceMutation = useMutation({
    mutationFn: (input: Parameters<typeof createWorkspace>[0]) => createWorkspace(input)
  })
  const archiveWorkspaceMutation = useMutation({
    mutationFn: (input: Parameters<typeof archiveWorkspace>[0]) => archiveWorkspace(input)
  })
  const addProjectMutation = useMutation({ mutationFn: addProjectFromFolderPicker })
  const importConductorMutation = useMutation({ mutationFn: () => importConductorProjects() })
  const removeProjectMutation = useMutation({
    mutationFn: (input: Parameters<typeof removeProject>[0]) => removeProject(input)
  })
  const retryWorkspaceMutation = useMutation({
    mutationFn: (workspaceId: string) => retryWorkspaceOperation(workspaceId)
  })
  const openWorkspaceMutation = useMutation({
    mutationFn: ({ worktreeId, target }: { worktreeId: string; target: OpenWorkspaceTargetDto }) =>
      openWorkspace(worktreeId, target)
  })
  const updateProjectSettingsMutation = useMutation({
    mutationFn: (input: Parameters<typeof updateProjectSettings>[0]) => updateProjectSettings(input)
  })
  const updateAppSettingsMutation = useMutation({
    mutationFn: (input: Parameters<typeof updateAppSettings>[0]) => updateAppSettings(input),
    onMutate: async (nextSettings) => {
      await queryClient.cancelQueries({ queryKey: worktreeQueryKeys.appSettings })
      const previousSettings = queryClient.getQueryData<AppSettingsDto>(
        worktreeQueryKeys.appSettings
      )
      queryClient.setQueryData(worktreeQueryKeys.appSettings, nextSettings)
      applyAppLanguage(nextSettings.language)
      return { previousSettings }
    },
    onSuccess: (savedSettings) => {
      queryClient.setQueryData(worktreeQueryKeys.appSettings, savedSettings)
      applyAppLanguage(savedSettings.language)
    },
    onError: (error, _nextSettings, context) => {
      const previousSettings = context?.previousSettings ?? DEFAULT_APP_SETTINGS
      queryClient.setQueryData(worktreeQueryKeys.appSettings, previousSettings)
      applyAppLanguage(previousSettings.language)
      showToast(describeError(error, t('toast.saveAppSettingsFailed')), 'error')
    }
  })

  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  useEffect(() => {
    applyAppLanguage(appSettings.language)
  }, [appSettings.language])

  // First launch: open Global Settings once so the user can choose their hover quick-open
  // apps. The flag is persisted (localStorage), so this fires only on the very first run.
  useEffect(() => {
    if (onboardingCompleted) return
    setOnboardingCompleted(true)
    setGlobalSettingsOpen(true)
  }, [onboardingCompleted, setOnboardingCompleted])

  useEffect(() => {
    if (projectsQuery.isError && !projectsLoadErrorShown.current) {
      projectsLoadErrorShown.current = true
      showToast(t('toast.loadProjectsFailed'), 'error')
    } else if (!projectsQuery.isError) {
      projectsLoadErrorShown.current = false
    }
  }, [projectsQuery.isError, t])

  useEffect(() => {
    if (appSettingsQuery.isError && !settingsLoadErrorShown.current) {
      settingsLoadErrorShown.current = true
      showToast(t('toast.loadSettingsFailed'), 'error')
    } else if (!appSettingsQuery.isError) {
      settingsLoadErrorShown.current = false
    }
  }, [appSettingsQuery.isError, t])

  const total = projects.reduce((n, project) => n + project.worktrees.length, 0)
  const settingsProject = settingsFor
    ? projects.find((project) => project.id === settingsFor)
    : null

  const flash = (message: string) => {
    showToast(message)
  }

  const reorderProjects = (activeId: string, overId: string) => {
    const next = reorderProjectsUseCase(projects, activeId, overId)
    setRawProjectOrder(next.map((project) => project.id))
  }

  const moveProject = (projectId: string, direction: 'up' | 'down' | 'top') => {
    const next = moveProjectUseCase(projects, projectId, direction)
    setRawProjectOrder(next.map((project) => project.id))
  }

  const moveWorktree = (
    projectId: string,
    worktreeId: string,
    direction: 'up' | 'down' | 'top'
  ) => {
    const next = moveWorktreeUseCase(projects, projectId, worktreeId, direction)
    writeProjectWorktreeOrder(next, projectId, worktreeOrderByProject, setRawWorktreeOrderByProject)
  }

  const setProjectCollapsed = (projectId: string, collapsed: boolean) => {
    const next = new Set(collapsedProjectIds)
    if (collapsed) {
      next.add(projectId)
    } else {
      next.delete(projectId)
    }
    setRawCollapsedProjectIds([...next])
  }

  const reorderWorktrees = (projectId: string, activeId: string, overId: string) => {
    const next = reorderWorktreesUseCase(projects, projectId, activeId, overId)
    writeProjectWorktreeOrder(next, projectId, worktreeOrderByProject, setRawWorktreeOrderByProject)
  }

  const switchTo = (worktree: Worktree, project: Project) => {
    queryClient.setQueryData<Project[]>(worktreeQueryKeys.projects, (current) =>
      current ? switchCurrentWorktree(current, worktree, project) : current
    )
  }

  const createWorktree = (project: Project, name: string, base: string) => {
    setAddingTo(null)
    showToast(t('toast.create', { project: project.name, name }), 'progress')
    void createWorkspaceMutation
      .mutateAsync({
        projectId: project.id,
        name,
        branch: name,
        baseBranch: base,
        runSetup: Boolean(project.commands.setup.trim())
      })
      .then(() => reloadProjects())
      .then(() => clearToast())
      .catch((error: unknown) => {
        const fallback = t('toast.createFailed', { project: project.name, name })
        const detail = describeError(error, fallback)
        void reloadProjects().finally(() => {
          showToast(detail === fallback ? fallback : `${fallback}: ${detail}`, 'error')
        })
      })
  }

  const archiveWorktree = (worktree: Worktree, project: Project) => {
    setCtx(null)
    const effectivePolicy = getEffectiveArchivePolicy(project, appSettings)
    if (effectivePolicy === 'ask') {
      setArchivePrompt({ worktree, project })
      return
    }
    void archiveWorktreeWithPolicy(worktree, project, null)
  }

  const archiveWorktreeWithPolicy = (
    worktree: Worktree,
    project: Project,
    policy: ArchivePolicyChoiceDto | null
  ) => {
    setArchivePrompt(null)
    showToast(t('toast.archive', { project: project.name, branch: worktree.branch }), 'progress')
    patchWorktree(project.id, worktree.id, { status: 'archiving' })
    void archiveWorkspaceMutation
      .mutateAsync({
        workspaceId: worktree.id,
        policy,
        rememberPolicy: false
      })
      .then(() => reloadProjects())
      .then(() => clearToast())
      .catch((error: unknown) => {
        patchWorktree(project.id, worktree.id, { status: 'ready' })
        const fallback = t('toast.archiveFailed', {
          project: project.name,
          branch: worktree.branch
        })
        const detail = describeError(error, fallback)
        showToast(detail === fallback ? fallback : `${fallback}: ${detail}`, 'error')
      })
  }

  const addProject = () => {
    void addProjectMutation
      .mutateAsync()
      .then((project) => {
        if (!project) return
        showToast(t('toast.addingProject'), 'progress')
        return reloadProjects().then(() => {
          clearToast()
        })
      })
      .catch((error: unknown) =>
        showToast(describeError(error, t('toast.addProjectFailed')), 'error')
      )
  }

  const importFromConductor = () => {
    showToast(t('toast.importingConductor'), 'progress')
    void importConductorMutation
      .mutateAsync()
      .then((candidates) => {
        if (candidates.length === 0) showToast(t('toast.noConductorWorkspaces'))
        return reloadProjects()
      })
      .then((nextProjects) => {
        if (nextProjects.length > 0) clearToast()
      })
      .catch((error: unknown) =>
        showToast(describeError(error, t('toast.importConductorFailed')), 'error')
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
    showToast(t('toast.saveProjectSettings'), 'progress')
    void updateProjectSettingsMutation
      .mutateAsync({
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
        showToast(describeError(error, t('toast.saveProjectSettingsFailed')), 'error')
      )
  }

  const requestRemoveProject = (project: Project) => {
    setRemoveProjectPrompt({ project })
  }

  const confirmRemoveProject = (project: Project) => {
    showToast(t('toast.removeProject', { project: project.name }), 'progress')
    void removeProjectMutation
      .mutateAsync({ projectId: project.id })
      .then(() => reloadProjects())
      .then(() => {
        setRemoveProjectPrompt(null)
        setSettingsFor(null)
        clearToast()
      })
      .catch((error: unknown) => {
        showToast(
          describeError(error, t('toast.removeProjectFailed', { project: project.name })),
          'error'
        )
      })
  }

  const setHoverQuickOpenTargets = (targets: OpenWorkspaceTargetDto[]) => {
    saveAppSettings({ ...appSettings, hoverQuickOpenTargets: targets })
  }

  const setLanguage = (language: AppLanguageDto) => {
    applyAppLanguage(language)
    saveAppSettings({ ...appSettings, language })
  }

  const setDefaultArchivePolicy = (policy: ArchivePolicyDto) => {
    saveAppSettings({ ...appSettings, defaultArchivePolicy: policy })
  }

  const setRemoveProjectBehavior = (behavior: RemoveProjectBehaviorDto) => {
    saveAppSettings({ ...appSettings, removeProjectBehavior: behavior })
  }

  const setNewProjectPosition = (position: NewProjectPositionDto) => {
    saveAppSettings({ ...appSettings, newProjectPosition: position })
  }

  const saveAppSettings = (next: AppSettingsDto) => {
    updateAppSettingsMutation.mutate(next)
  }

  const openWorktree = (worktree: Worktree, project: Project, target: OpenWorkspaceTargetDto) => {
    setCtx(null)
    void openWorkspaceMutation
      .mutateAsync({ worktreeId: worktree.id, target })
      .catch((error: unknown) =>
        showToast(
          describeError(
            error,
            t('toast.openFailed', { project: project.name, branch: worktree.branch })
          ),
          'error'
        )
      )
  }

  const viewWorktreeLog = (worktree: Worktree, project: Project) => {
    void getLatestOperation({ workspaceId: worktree.id })
      .then((operation) => {
        if (!operation) throw new Error(t('toast.noOperationLog'))
        return readOperationLog(operation.id)
      })
      .then((content) => {
        setLogViewer({ title: `${project.name}/${worktree.branch}`, content })
      })
      .catch((error: unknown) => showToast(describeError(error, t('toast.readLogFailed')), 'error'))
  }

  const retryWorktree = (worktree: Worktree, project: Project) => {
    showToast(t('toast.retry', { project: project.name, branch: worktree.branch }), 'progress')
    void retryWorkspaceMutation
      .mutateAsync(worktree.id)
      .then(() => reloadProjects())
      .then(() => clearToast())
      .catch((error: unknown) =>
        showToast(
          describeError(
            error,
            t('toast.retryFailed', { project: project.name, branch: worktree.branch })
          ),
          'error'
        )
      )
  }

  return {
    addingTo,
    addProject,
    appSettings,
    appSettingsSaving: updateAppSettingsMutation.isPending,
    archivePrompt,
    archiveWorktree,
    archiveWorktreeWithPolicy,
    clearToast,
    collapsedProjectIds,
    confirmRemoveProject,
    createWorktree,
    ctx,
    flash,
    importFromConductor,
    globalSettingsOpen,
    logViewer,
    moveProject,
    moveWorktree,
    openWorktree,
    projects,
    removeProjectPrompt,
    reorderProjects,
    reorderWorktrees,
    requestRemoveProject,
    retryWorktree,
    setAddingTo,
    setArchivePrompt,
    setProjectCollapsed,
    setCtx,
    setHoverQuickOpenTargets,
    setDefaultArchivePolicy,
    setLanguage,
    setRemoveProjectBehavior,
    setNewProjectPosition,
    setGlobalSettingsOpen,
    setLogViewer,
    setRemoveProjectPrompt,
    setSettingsFor,
    saveProjectSettings,
    settingsProject,
    switchTo,
    toast,
    total,
    viewWorktreeLog
  }
}

function getEffectiveArchivePolicy(project: Project, settings: AppSettingsDto) {
  return project.archivePolicy === 'use_global'
    ? settings.defaultArchivePolicy
    : project.archivePolicy
}

function applySortOrder(
  projects: Project[],
  projectOrder: string[],
  worktreeOrderByProject: Record<string, string[]>,
  newProjectPosition: NewProjectPositionDto
) {
  return orderProjects(projects, projectOrder, newProjectPosition).map((project) => ({
    ...project,
    worktrees: orderBySavedIds(
      project.worktrees,
      worktreeOrderByProject[project.id] ?? [],
      (worktree) => worktree.id
    )
  }))
}

function orderProjects(
  projects: Project[],
  savedIds: string[],
  newPosition: NewProjectPositionDto
) {
  const byId = new Map(projects.map((project) => [project.id, project]))
  const seen = new Set(savedIds)
  const ordered = savedIds
    .map((id) => byId.get(id))
    .filter((project): project is Project => Boolean(project))
  // Backend returns projects newest-registration-first, so `fresh` is newest first.
  const fresh = projects.filter((project) => !seen.has(project.id))
  return newPosition === 'last' ? [...ordered, ...[...fresh].reverse()] : [...fresh, ...ordered]
}

function writeProjectWorktreeOrder(
  projects: Project[],
  projectId: string,
  currentOrder: Record<string, string[]>,
  setOrder: (value: Record<string, string[]>) => void
) {
  const project = projects.find((item) => item.id === projectId)
  if (!project) return
  setOrder({
    ...currentOrder,
    [projectId]: project.worktrees.map((worktree) => worktree.id)
  })
}

function orderBySavedIds<T>(items: T[], savedIds: string[], getId: (item: T) => string) {
  if (savedIds.length === 0) return items
  const byId = new Map(items.map((item) => [getId(item), item]))
  const ordered = savedIds.map((id) => byId.get(id)).filter((item): item is T => Boolean(item))
  const seen = new Set(savedIds)
  const appended = items.filter((item) => !seen.has(getId(item)))
  return [...ordered, ...appended]
}
