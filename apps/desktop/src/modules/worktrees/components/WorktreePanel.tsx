/**
 * @purpose Composes the full Grove worktree panel UI.
 * @role    Feature root component; wires state hook, project sorting, settings sheets, toast, and context menu.
 * @deps    @dnd-kit/core/sortable, Hero UI Button, Worktrees contracts/state/API, shared UI/lib/icons
 * @gotcha  Settings and action overlays use BottomSheet so the panel context stays visible; docs/modules/worktrees/README.md
 */
import { Button } from '@heroui/react/button'
import { useTranslation } from 'react-i18next'
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent
} from '@dnd-kit/core'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy
} from '@dnd-kit/sortable'
import type { Density, Project } from '../../../shared/contracts/worktrees'
import { useWorktreePanelState } from '../hooks/useWorktreePanelState'
import { sortableMeasuring } from '../../../shared/lib/sortable'
import { hexA } from '../../../shared/lib/color'
import type { CSSVars } from '../../../shared/lib/styles'
import { Spinner } from '../../../shared/icons'
import { BottomSheet } from '../../../shared/ui/BottomSheet'
import { Toast } from '../../../shared/ui/Toast'
import { ContextMenu } from './ContextMenu'
import { GlobalSettings } from './GlobalSettings'
import { PanelFooter } from './PanelFooter'
import { PanelHeader } from './PanelHeader'
import { PanelShell } from './PanelShell'
import { ProjectSection } from './ProjectSection'
import { ProjectSettings } from './ProjectSettings'
import { ArchiveChoice } from './settings/ArchiveChoice'
import { LogViewer } from './settings/LogViewer'
import { RemoveProjectChoice } from './settings/RemoveProjectChoice'

export interface WorktreePanelProps {
  accent?: string
  density?: Density
  showCommit?: boolean
  initialProjects?: Project[]
  onQuit?: () => void
}

export function WorktreePanel({
  accent = '#2f6fe0',
  density = 'comfortable',
  showCommit = true,
  initialProjects = [],
  onQuit
}: WorktreePanelProps) {
  const state = useWorktreePanelState(initialProjects)
  const { t } = useTranslation()
  const panelStyle: CSSVars = { '--accent': accent, '--accent-soft': hexA(accent, 0.1) }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleProjectDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) state.reorderProjects(String(active.id), String(over.id))
  }

  return (
    <PanelShell
      style={panelStyle}
      header={
        <PanelHeader
          total={state.total}
          projectCount={state.projects.length}
          onAddProject={state.addProject}
          onOpenSettings={() => state.setGlobalSettingsOpen(true)}
        />
      }
      footer={
        <PanelFooter
          language={state.appSettings.language}
          saving={state.appSettingsSaving}
          onLanguageChange={state.setLanguage}
          onQuit={onQuit}
        />
      }
    >
      {state.projects.length === 0 ? (
        <EmptyProjectList
          addProjectLabel={t('empty.addProject')}
          howItWorksLabel={t('empty.howItWorks')}
          importLabel={t('empty.importFromConductor')}
          orLabel={t('empty.or')}
          title={t('empty.headline')}
          onAddProject={state.addProject}
          onImport={state.importFromConductor}
        />
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          measuring={sortableMeasuring}
          modifiers={[restrictToVerticalAxis]}
          onDragEnd={handleProjectDragEnd}
        >
          <SortableContext
            items={state.projects.map((project) => project.id)}
            strategy={verticalListSortingStrategy}
          >
            {state.projects.map((project, index) => (
              <ProjectSection
                key={project.id}
                project={project}
                density={density}
                hoverQuickOpenTargets={state.appSettings.hoverQuickOpenTargets}
                showCommit={showCommit}
                isAdding={state.addingTo === project.id}
                collapsed={state.collapsedProjectIds.has(project.id)}
                activeContextWorktreeId={state.ctx?.worktree.id ?? null}
                isFirst={index === 0}
                isLast={index === state.projects.length - 1}
                onAddWorktree={state.setAddingTo}
                onCancelAdd={() => state.setAddingTo(null)}
                onCreateWorktree={state.createWorktree}
                onCollapsedChange={(collapsed) => state.setProjectCollapsed(project.id, collapsed)}
                onEditSettings={state.setSettingsFor}
                onMove={(direction) => state.moveProject(project.id, direction)}
                onMoveWorktree={(worktreeId, direction) =>
                  state.moveWorktree(project.id, worktreeId, direction)
                }
                onReorderWorktrees={(activeId, overId) =>
                  state.reorderWorktrees(project.id, activeId, overId)
                }
                onContext={(event, worktree, item) =>
                  state.setCtx({ x: event.clientX, y: event.clientY, worktree, project: item })
                }
                onOpenWorkspace={state.openWorktree}
              />
            ))}
          </SortableContext>
        </DndContext>
      )}

      {state.toast && (
        <Toast
          closeLabel={t('common.close')}
          tone={state.toast.tone}
          icon={
            state.toast.tone === 'progress' ? (
              <Spinner className="shrink-0 animate-spin text-[#7fb4ff]" />
            ) : null
          }
          onClose={state.clearToast}
        >
          {state.toast.message}
        </Toast>
      )}

      {state.ctx && (
        <ContextMenu
          ctx={state.ctx}
          onClose={() => state.setCtx(null)}
          onArchive={state.archiveWorktree}
          onRetry={state.retryWorktree}
          onViewLog={state.viewWorktreeLog}
          onOpenWorkspace={state.openWorktree}
          onEditCommands={(project) => {
            state.setCtx(null)
            state.setSettingsFor(project.id)
          }}
        />
      )}

      <BottomSheet
        ariaLabel={t('settings.title')}
        className="bottom-sheet-surface rounded-[var(--window-radius)] border-[0.5px] p-1.5 font-sans text-[13.5px] text-[#1c1c1e] antialiased shadow-panel"
        maxHeightClassName="max-h-[min(94vh,700px)]"
        isOpen={state.globalSettingsOpen}
        onClose={() => state.setGlobalSettingsOpen(false)}
      >
        <GlobalSettings
          settings={state.appSettings}
          saving={state.appSettingsSaving}
          onDefaultArchivePolicyChange={state.setDefaultArchivePolicy}
          onHoverQuickOpenTargetsChange={state.setHoverQuickOpenTargets}
          onLanguageChange={state.setLanguage}
          onNewProjectPositionChange={state.setNewProjectPosition}
          onRemoveProjectBehaviorChange={state.setRemoveProjectBehavior}
          onClose={() => state.setGlobalSettingsOpen(false)}
        />
      </BottomSheet>

      {state.archivePrompt && (
        <BottomSheet
          ariaLabel={t('sheets.archive.title')}
          className="bottom-sheet-surface rounded-[var(--window-radius)] border-[0.5px] p-2 font-sans text-[13.5px] text-[#1c1c1e] antialiased shadow-panel"
          elevated
          isOpen
          onClose={() => state.setArchivePrompt(null)}
        >
          <ArchiveChoice
            projectName={state.archivePrompt.project.name}
            worktreeBranch={state.archivePrompt.worktree.branch}
            onHide={() =>
              state.archiveWorktreeWithPolicy(
                state.archivePrompt!.worktree,
                state.archivePrompt!.project,
                'hide'
              )
            }
            onRemove={() =>
              state.archiveWorktreeWithPolicy(
                state.archivePrompt!.worktree,
                state.archivePrompt!.project,
                'remove_worktree'
              )
            }
            onCancel={() => state.setArchivePrompt(null)}
          />
        </BottomSheet>
      )}

      {state.removeProjectPrompt && (
        <BottomSheet
          ariaLabel={t('sheets.removeProject.title')}
          className="bottom-sheet-surface rounded-[var(--window-radius)] border-[0.5px] p-2 font-sans text-[13.5px] text-[#1c1c1e] antialiased shadow-panel"
          elevated
          isOpen
          onClose={() => state.setRemoveProjectPrompt(null)}
        >
          <RemoveProjectChoice
            behavior={state.appSettings.removeProjectBehavior}
            project={state.removeProjectPrompt.project}
            onCancel={() => state.setRemoveProjectPrompt(null)}
            onConfirm={() => state.confirmRemoveProject(state.removeProjectPrompt!.project)}
          />
        </BottomSheet>
      )}

      {state.logViewer && (
        <BottomSheet
          ariaLabel={t('sheets.log.title')}
          className="bottom-sheet-surface rounded-[var(--window-radius)] border-[0.5px] p-2 font-sans text-[13.5px] text-[#1c1c1e] antialiased shadow-panel"
          isOpen
          onClose={() => state.setLogViewer(null)}
        >
          <LogViewer
            title={state.logViewer.title}
            content={state.logViewer.content}
            onClose={() => state.setLogViewer(null)}
          />
        </BottomSheet>
      )}

      {state.settingsProject && (
        <BottomSheet
          ariaLabel={`${state.settingsProject.name} ${t('settings.title')}`}
          className="bottom-sheet-surface rounded-[var(--window-radius)] border-[0.5px] p-1.5 font-sans text-[13.5px] text-[#1c1c1e] antialiased shadow-panel"
          isOpen
          onClose={() => state.setSettingsFor(null)}
        >
          <ProjectSettings
            project={state.settingsProject}
            onRemoveProject={state.requestRemoveProject}
            onSave={state.saveProjectSettings}
            onClose={() => state.setSettingsFor(null)}
          />
        </BottomSheet>
      )}
    </PanelShell>
  )
}

function EmptyProjectList({
  title,
  importLabel,
  orLabel,
  addProjectLabel,
  howItWorksLabel,
  onAddProject,
  onImport
}: {
  title: string
  importLabel: string
  orLabel: string
  addProjectLabel: string
  howItWorksLabel: string
  onAddProject: () => void
  onImport: () => void
}) {
  return (
    <div className="flex min-h-full items-center justify-center px-6 py-10 text-center">
      <div className="space-y-2 text-[13px] leading-5 text-black/45">
        <p>
          <Button
            onPress={onImport}
            size="sm"
            variant="ghost"
            className="inline h-auto min-w-0 bg-transparent p-0 align-baseline font-medium text-accent underline underline-offset-2 outline-none transition-colors hover:bg-transparent hover:text-[#1c1c1e] focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          >
            {importLabel}
          </Button>{' '}
          {orLabel}{' '}
          <Button
            onPress={onAddProject}
            size="sm"
            variant="ghost"
            className="inline h-auto min-w-0 bg-transparent p-0 align-baseline font-medium text-accent underline underline-offset-2 outline-none transition-colors hover:bg-transparent hover:text-[#1c1c1e] focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          >
            {addProjectLabel}
          </Button>
        </p>
        <span className="sr-only">{title}</span>
        <a
          href="https://example.com/grove-worktrees"
          target="_blank"
          rel="noreferrer"
          className="inline-block font-medium text-black/45 underline underline-offset-2 transition-colors hover:text-[#1c1c1e]"
        >
          {howItWorksLabel}
        </a>
      </div>
    </div>
  )
}
