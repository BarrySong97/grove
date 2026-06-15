/**
 * @purpose Wraps generated Grove business commands for the Worktrees frontend module.
 * @role    Frontend API adapter between React hooks and type-safe Tauri command bindings.
 * @deps    generated src/shared/bindings/commands
 * @gotcha  Keep this thin; workflows belong in Rust use cases or React hooks, not here.
 */
import {
  commands,
  type AppErrorDto,
  type ArchivePolicyChoiceDto,
  type ConductorImportCandidateDto,
  type OpenWorkspaceTargetDto,
  type ProjectDto,
  type UpdateProjectSettingsInput,
  type WorkspaceDto,
  type WorktreeProjectDto
} from '../../../shared/bindings/commands'
import type { Project, Worktree, WorktreeStatus } from '../../../shared/contracts/worktrees'

export class GroveCommandError extends Error {
  readonly code: string
  readonly details: string | null
  readonly recoverable: boolean

  constructor(error: AppErrorDto) {
    super(error.message)
    this.name = 'GroveCommandError'
    this.code = error.code
    this.details = error.details
    this.recoverable = error.recoverable
  }
}

export async function listProjects(): Promise<ProjectDto[]> {
  const result = await commands.listProjects()
  if (result.status === 'error') throw new GroveCommandError(result.error)
  return result.data
}

export async function importConductorProjects(
  workspaceRoot: string | null = null
): Promise<ConductorImportCandidateDto[]> {
  const result = await commands.importConductorProjects({ workspaceRoot })
  if (result.status === 'error') throw new GroveCommandError(result.error)
  return result.data
}

export async function listWorktreeProjects(): Promise<WorktreeProjectDto[]> {
  const result = await commands.listWorktreeProjects()
  if (result.status === 'error') throw new GroveCommandError(result.error)
  return result.data
}

export async function loadWorktreePanelProjects(): Promise<Project[]> {
  const projects = await listWorktreeProjects()
  return projects.map(mapProject)
}

function mapProject(item: WorktreeProjectDto): Project {
  return {
    id: item.project.id,
    name: item.project.name,
    path: item.project.rootPath,
    workspaceRoot: item.project.workspaceRoot,
    accent: projectAccent(item.project.id),
    archivePolicy: item.project.archivePolicy,
    commands: item.commands,
    worktrees: item.workspaces
      .filter((workspace) => workspace.lifecycleStatus === 'active')
      .map(mapWorkspace)
  }
}

export async function refreshProject(projectId: string): Promise<WorkspaceDto[]> {
  const result = await commands.refreshProject({ projectId })
  if (result.status === 'error') throw new GroveCommandError(result.error)
  return result.data
}

export async function updateProjectSettings(
  input: UpdateProjectSettingsInput
): Promise<ProjectDto> {
  const result = await commands.updateProjectSettings(input)
  if (result.status === 'error') throw new GroveCommandError(result.error)
  return result.data
}

export async function createWorkspace(input: {
  projectId: string
  name: string
  branch: string
  baseBranch: string
  runSetup: boolean
}): Promise<WorkspaceDto> {
  const result = await commands.createWorkspace(input)
  if (result.status === 'error') throw new GroveCommandError(result.error)
  return result.data
}

export async function archiveWorkspace(input: {
  workspaceId: string
  policy: ArchivePolicyChoiceDto
  rememberPolicy: boolean
}): Promise<WorkspaceDto> {
  const result = await commands.archiveWorkspace(input)
  if (result.status === 'error') throw new GroveCommandError(result.error)
  return result.data
}

export async function openWorkspace(
  workspaceId: string,
  target: OpenWorkspaceTargetDto
): Promise<WorkspaceDto> {
  const result = await commands.openWorkspace({ workspaceId, target })
  if (result.status === 'error') throw new GroveCommandError(result.error)
  return result.data
}

function mapWorkspace(workspace: WorktreeProjectDto['workspaces'][number]): Worktree {
  return {
    id: workspace.id,
    branch: workspace.branch,
    base: workspace.baseBranch,
    current: false,
    ahead: workspace.gitState?.ahead ?? 0,
    behind: workspace.gitState?.behind ?? 0,
    dirty: workspace.gitState?.dirty ?? 0,
    status: mapOperationStatus(workspace.operationStatus),
    time: workspace.gitState?.capturedAt ?? 'now',
    message: workspace.gitState?.lastCommitMessage || 'imported workspace',
    path: workspace.path
  }
}

function mapOperationStatus(
  status: WorktreeProjectDto['workspaces'][number]['operationStatus']
): WorktreeStatus {
  if (status === 'archiving') return 'archiving'
  if (status === 'creating' || status === 'setting_up') return 'setting-up'
  return 'ready'
}

function projectAccent(projectId: string) {
  const palette = ['#3aa856', '#9a6ad8', '#d98a2b', '#2f6fe0', '#d65268', '#16857a']
  const index = [...projectId].reduce((sum, char) => sum + char.charCodeAt(0), 0) % palette.length
  return palette[index]
}
