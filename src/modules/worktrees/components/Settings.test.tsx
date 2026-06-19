/**
 * @purpose Tests GlobalSettings and ProjectSettings form payloads.
 * @role    Frontend unit tests for settings workflow wiring.
 * @deps    vitest, Testing Library, settings components
 * @gotcha  Tests verify UI payloads only; persistence is covered by Rust tests.
 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { AppSettingsDto } from '../../../shared/bindings/commands'
import type { Project } from '../../../shared/contracts/worktrees'
import { GlobalSettings } from './GlobalSettings'
import { ProjectSettings } from './ProjectSettings'

describe('GlobalSettings', () => {
  it('saves archive and remove project behavior without executing removal', () => {
    const settings: AppSettingsDto = {
      language: 'system',
      hoverQuickOpenTargets: ['cursor', 'terminal'],
      ghosttyOpenMode: 'window',
      defaultArchivePolicy: 'ask',
      removeProjectBehavior: 'grove_only'
    }
    const onDefaultArchivePolicyChange = vi.fn()
    const onLanguageChange = vi.fn()
    const onRemoveProjectBehaviorChange = vi.fn()

    render(
      <GlobalSettings
        settings={settings}
        saving={false}
        onClose={vi.fn()}
        onDefaultArchivePolicyChange={onDefaultArchivePolicyChange}
        onHoverQuickOpenTargetsChange={vi.fn()}
        onGhosttyOpenModeChange={vi.fn()}
        onLanguageChange={onLanguageChange}
        onRemoveProjectBehaviorChange={onRemoveProjectBehaviorChange}
      />
    )

    fireEvent.change(screen.getByLabelText('Application language'), {
      target: { value: 'zh_cn' }
    })
    fireEvent.change(screen.getByLabelText('Default archive workspace behavior'), {
      target: { value: 'remove_worktree' }
    })
    fireEvent.change(screen.getByLabelText('Remove project behavior'), {
      target: { value: 'delete_worktrees' }
    })

    expect(onLanguageChange).toHaveBeenCalledWith('zh_cn')
    expect(onDefaultArchivePolicyChange).toHaveBeenCalledWith('remove_worktree')
    expect(onRemoveProjectBehaviorChange).toHaveBeenCalledWith('delete_worktrees')
  })

  it('toggles hover quick-open targets on and off', () => {
    const settings: AppSettingsDto = {
      language: 'system',
      hoverQuickOpenTargets: ['cursor', 'terminal'],
      ghosttyOpenMode: 'window',
      defaultArchivePolicy: 'ask',
      removeProjectBehavior: 'grove_only'
    }
    const onHoverQuickOpenTargetsChange = vi.fn()

    render(
      <GlobalSettings
        settings={settings}
        saving={false}
        onClose={vi.fn()}
        onDefaultArchivePolicyChange={vi.fn()}
        onHoverQuickOpenTargetsChange={onHoverQuickOpenTargetsChange}
        onGhosttyOpenModeChange={vi.fn()}
        onLanguageChange={vi.fn()}
        onRemoveProjectBehaviorChange={vi.fn()}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Zed' }))
    expect(onHoverQuickOpenTargetsChange).toHaveBeenCalledWith(['cursor', 'terminal', 'zed'])

    fireEvent.click(screen.getByRole('button', { name: 'Cursor' }))
    expect(onHoverQuickOpenTargetsChange).toHaveBeenCalledWith(['terminal'])
  })
})

describe('ProjectSettings', () => {
  it('saves workspace root, archive override, and setup/archive commands', async () => {
    const onSave = vi.fn()
    const { container } = render(
      <ProjectSettings
        project={makeProject()}
        onClose={vi.fn()}
        onRemoveProject={vi.fn()}
        onSave={onSave}
      />
    )

    fireEvent.change(screen.getByLabelText('Workspace root'), {
      target: { value: '/tmp/custom-workspaces' }
    })
    fireEvent.change(screen.getByLabelText('Archive'), {
      target: { value: 'hide' }
    })
    fireEvent.change(screen.getByPlaceholderText('npm install'), {
      target: { value: 'pnpm install' }
    })
    fireEvent.change(screen.getByPlaceholderText('rm -rf node_modules'), {
      target: { value: './archive.sh' }
    })
    fireEvent.submit(container.querySelector('form')!)

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith('project-1', {
        workspaceRoot: '/tmp/custom-workspaces',
        archivePolicy: 'hide',
        commands: { setup: 'pnpm install', archive: './archive.sh' }
      })
    })
  })

  it('exposes remove project without deleting the main repo from settings itself', () => {
    const onRemoveProject = vi.fn()
    const project = makeProject()
    render(
      <ProjectSettings
        project={project}
        onClose={vi.fn()}
        onRemoveProject={onRemoveProject}
        onSave={vi.fn()}
      />
    )

    fireEvent.click(screen.getByText('Remove Project…'))

    expect(onRemoveProject).toHaveBeenCalledWith(project)
    expect(screen.getByText(/main repository directory is never deleted/i)).toBeTruthy()
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
