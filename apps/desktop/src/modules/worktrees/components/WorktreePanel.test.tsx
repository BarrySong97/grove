/**
 * @purpose Tests WorktreePanel empty-state and action-sheet workflow wiring.
 * @role    Frontend unit tests for user-facing worktree panel behavior.
 * @deps    vitest, Testing Library, WorktreePanel
 * @gotcha  Tauri command wrappers are mocked; Rust workflows are covered separately.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { ReactElement } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { AppSettingsDto } from '../../../shared/bindings/commands'
import type { Project, Worktree } from '../../../shared/contracts/worktrees'
import { i18n } from '../../../shared/i18n/i18n'
import { ContextMenu } from './ContextMenu'
import { NewWorktreeEditor } from './NewWorktreeEditor'
import { WorktreePanel } from './WorktreePanel'

const defaultSettings: AppSettingsDto = {
  language: 'system',
  hoverQuickOpenTargets: ['cursor', 'terminal'],
  defaultArchivePolicy: 'ask',
  removeProjectBehavior: 'grove_only',
  newProjectPosition: 'first'
}

const api = vi.hoisted(() => ({
  addProjectFromFolderPicker: vi.fn(),
  archiveWorkspace: vi.fn(),
  createWorkspace: vi.fn(),
  getAppSettings: vi.fn(),
  getLatestOperation: vi.fn(),
  importConductorProjects: vi.fn(),
  listBaseBranches: vi.fn(),
  loadWorktreePanelProjects: vi.fn(),
  openWorkspace: vi.fn(),
  readOperationLog: vi.fn(),
  removeProject: vi.fn(),
  retryWorkspaceOperation: vi.fn(),
  updateAppSettings: vi.fn(),
  updateProjectSettings: vi.fn()
}))

vi.mock('../api/groveCommands', () => api)

// useWorktreePanelState wires a Tauri window focus listener; stub it for jsdom.
vi.mock('@tauri-apps/api/window', () => ({
  getCurrentWindow: () => ({ onFocusChanged: () => Promise.resolve(() => {}) })
}))

beforeEach(async () => {
  await i18n.changeLanguage('en-US')
  window.localStorage.clear()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('WorktreePanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    api.getAppSettings.mockResolvedValue(defaultSettings)
    api.loadWorktreePanelProjects.mockResolvedValue([])
    api.importConductorProjects.mockResolvedValue([])
    api.addProjectFromFolderPicker.mockResolvedValue(null)
    api.listBaseBranches.mockResolvedValue([])
    api.updateAppSettings.mockImplementation((settings: AppSettingsDto) =>
      Promise.resolve(settings)
    )
  })

  it('wires empty-state import and add actions separately', async () => {
    renderWithQueryClient(<WorktreePanel />)

    fireEvent.click(await screen.findByText('Import from Conductor'))
    await waitFor(() => expect(api.importConductorProjects).toHaveBeenCalledTimes(1))
    expect(api.addProjectFromFolderPicker).not.toHaveBeenCalled()

    fireEvent.click(screen.getByText('Add Project'))
    await waitFor(() => expect(api.addProjectFromFolderPicker).toHaveBeenCalledTimes(1))
  })

  it('renders the how-it-works link as an external link', async () => {
    renderWithQueryClient(<WorktreePanel />)

    const link = await screen.findByText('How it works')
    expect(link.closest('a')?.getAttribute('href')).toBe('https://example.com/grove-worktrees')
    expect(link.closest('a')?.getAttribute('target')).toBe('_blank')
  })

  it('persists language changes from the footer shortcut', async () => {
    renderWithQueryClient(<WorktreePanel />)

    fireEvent.change(await screen.findByLabelText('Language'), {
      target: { value: 'zh_cn' }
    })

    await waitFor(() =>
      expect(api.updateAppSettings).toHaveBeenCalledWith({ ...defaultSettings, language: 'zh_cn' })
    )
  })

  it('lets top alerts close immediately and auto-dismisses them after five seconds', async () => {
    renderWithQueryClient(<WorktreePanel />)
    const importButton = await screen.findByText('Import from Conductor')
    vi.useFakeTimers()

    fireEvent.click(importButton)
    await flushAsyncWork()
    expect(screen.getByText('No Conductor workspaces found')).toBeTruthy()

    fireEvent.click(screen.getByLabelText('Close'))
    expect(screen.queryByText('No Conductor workspaces found')).toBeNull()

    fireEvent.click(importButton)
    await flushAsyncWork()
    expect(screen.getByText('No Conductor workspaces found')).toBeTruthy()
    act(() => vi.advanceTimersByTime(4999))
    expect(screen.getByText('No Conductor workspaces found')).toBeTruthy()
    act(() => vi.advanceTimersByTime(1))
    expect(screen.queryByText('No Conductor workspaces found')).toBeNull()
  })

  it('keeps long-running progress alerts until the operation settles or the user closes them', async () => {
    renderWithQueryClient(<WorktreePanel />)
    const importButton = await screen.findByText('Import from Conductor')
    api.importConductorProjects.mockReturnValue(new Promise(() => {}))
    vi.useFakeTimers()

    fireEvent.click(importButton)
    expect(screen.getByText('Importing Conductor workspaces')).toBeTruthy()

    act(() => vi.advanceTimersByTime(8000))
    expect(screen.getByText('Importing Conductor workspaces')).toBeTruthy()

    fireEvent.click(screen.getByLabelText('Close'))
    expect(screen.queryByText('Importing Conductor workspaces')).toBeNull()
  })
})

describe('NewWorktreeEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    api.listBaseBranches.mockResolvedValue(['origin/main', 'main', 'origin/release'])
  })

  it('loads remote base branches and prefers the origin default', async () => {
    const project = makeProject()
    const onCreate = vi.fn()
    renderWithQueryClient(
      <NewWorktreeEditor project={project} onCreate={onCreate} onCancel={vi.fn()} />
    )

    const branchSelect = await screen.findByDisplayValue('origin/main')
    const branchOptions = Array.from(branchSelect.querySelectorAll('option')).map(
      (option) => option.value
    )

    expect(api.listBaseBranches).toHaveBeenCalledWith(project.id)
    expect(branchOptions).toContain('origin/main')
    expect(branchOptions).toContain('origin/release')

    fireEvent.change(screen.getByPlaceholderText('feature-name'), {
      target: { value: 'feature/new-worktree' }
    })
    await waitFor(() =>
      expect((screen.getByText('Confirm') as HTMLButtonElement).disabled).toBe(false)
    )

    fireEvent.click(screen.getByText('Confirm'))

    await waitFor(() =>
      expect(onCreate).toHaveBeenCalledWith(project, 'feature/new-worktree', 'origin/main')
    )
  })
})

function renderWithQueryClient(ui: ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        gcTime: 0,
        retry: false
      },
      mutations: {
        retry: false
      }
    }
  })

  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>)
}

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

  it('does not archive the protected root worktree from the action sheet', () => {
    const project = makeProject()
    const worktree = makeWorktree({ isDefault: true, branch: 'main', path: project.path })
    const onArchive = vi.fn()
    render(
      <ContextMenu
        ctx={{ x: 0, y: 0, project, worktree }}
        onArchive={onArchive}
        onClose={vi.fn()}
        onEditCommands={vi.fn()}
        onOpenWorkspace={vi.fn()}
        onRetry={vi.fn()}
        onViewLog={vi.fn()}
      />
    )

    fireEvent.click(screen.getByText('Archive Worktree…'))

    expect(onArchive).not.toHaveBeenCalled()
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

async function flushAsyncWork() {
  await act(async () => {
    await Promise.resolve()
    await Promise.resolve()
    await Promise.resolve()
  })
}

function makeWorktree(patch: Partial<Worktree> = {}): Worktree {
  return {
    id: 'workspace-1',
    branch: 'feature/test',
    base: 'main',
    current: false,
    isDefault: false,
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
