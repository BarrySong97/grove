/**
 * @purpose Tests WorktreePanel empty-state and action-sheet workflow wiring.
 * @role    Frontend unit tests for user-facing worktree panel behavior.
 * @deps    vitest, Testing Library, WorktreePanel
 * @gotcha  Tauri command wrappers are mocked; Rust workflows are covered separately.
 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AppSettingsDto } from '../../../shared/bindings/commands'
import type { Project, Worktree } from '../../../shared/contracts/worktrees'
import { ContextMenu } from './ContextMenu'
import { WorktreePanel } from './WorktreePanel'

const defaultSettings: AppSettingsDto = {
  defaultOpenTarget: 'cursor',
  ghosttyOpenMode: 'window',
  defaultArchivePolicy: 'ask',
  removeProjectBehavior: 'grove_only'
}

const api = vi.hoisted(() => ({
  addProjectFromFolderPicker: vi.fn(),
  archiveWorkspace: vi.fn(),
  createWorkspace: vi.fn(),
  getAppSettings: vi.fn(),
  getLatestOperation: vi.fn(),
  importConductorProjects: vi.fn(),
  loadWorktreePanelProjects: vi.fn(),
  openWorkspace: vi.fn(),
  readOperationLog: vi.fn(),
  removeProject: vi.fn(),
  retryWorkspaceOperation: vi.fn(),
  updateAppSettings: vi.fn(),
  updateProjectSettings: vi.fn()
}))

vi.mock('../api/groveCommands', () => api)

describe('WorktreePanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    api.getAppSettings.mockResolvedValue(defaultSettings)
    api.loadWorktreePanelProjects.mockResolvedValue([])
    api.importConductorProjects.mockResolvedValue([])
    api.addProjectFromFolderPicker.mockResolvedValue(null)
  })

  it('wires empty-state import and add actions separately', async () => {
    render(<WorktreePanel />)

    fireEvent.click(await screen.findByText('Import from Conductor'))
    await waitFor(() => expect(api.importConductorProjects).toHaveBeenCalledTimes(1))
    expect(api.addProjectFromFolderPicker).not.toHaveBeenCalled()

    fireEvent.click(screen.getByText('Add Project'))
    await waitFor(() => expect(api.addProjectFromFolderPicker).toHaveBeenCalledTimes(1))
  })

  it('renders the how-it-works link as an external link', async () => {
    render(<WorktreePanel />)

    const link = await screen.findByText('How it works')
    expect(link.closest('a')?.getAttribute('href')).toBe('https://example.com/grove-worktrees')
    expect(link.closest('a')?.getAttribute('target')).toBe('_blank')
  })
})

describe('ContextMenu', () => {
  it('does not render Run Command and shows recovery actions for failed worktrees', () => {
    const project = makeProject()
    const worktree = makeWorktree({ status: 'failed' })
    render(
      <ContextMenu
        ctx={{ x: 0, y: 0, project, worktree }}
        onArchive={vi.fn()}
        onClose={vi.fn()}
        onEditCommands={vi.fn()}
        onOpenWorkspace={vi.fn()}
        onRetry={vi.fn()}
        onViewLog={vi.fn()}
      />
    )

    expect(screen.queryByText('Run Command')).toBeNull()
    expect(screen.getByText('View Log')).toBeTruthy()
    expect(screen.getByText('Retry')).toBeTruthy()
  })
})

function makeProject(): Project {
  return {
    id: 'project-1',
    name: 'Project',
    path: '/repo/project',
    workspaceRoot: '/workspaces/project',
    defaultBranch: 'main',
    accent: '#2f6fe0',
    archivePolicy: 'use_global',
    commands: { setup: '', archive: '' },
    worktrees: []
  }
}

function makeWorktree(patch: Partial<Worktree> = {}): Worktree {
  return {
    id: 'workspace-1',
    branch: 'feature/test',
    base: 'main',
    current: false,
    ahead: 0,
    behind: 0,
    dirty: 0,
    status: 'ready',
    time: 'now',
    message: 'test',
    path: '/workspaces/project/feature-test',
    ...patch
  }
}
