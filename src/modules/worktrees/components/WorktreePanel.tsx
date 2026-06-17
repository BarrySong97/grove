/**
 * @purpose Composes the full Grove worktree panel UI.
 * @role    Feature root component; wires state hook, project sorting, settings views, toast, and context menu.
 * @deps    @dnd-kit/core/sortable, Hero UI Button, Worktrees contracts/state/API, shared UI/lib/icons
 * @gotcha  Panel shell transparency and settings views share the same glass surface constraints; docs/modules/worktrees/README.md
 */
import { Button } from '@heroui/react/button'
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
import { ScrollArea } from '../../../shared/ui/ScrollArea'
import { Toast } from '../../../shared/ui/Toast'
import { ContextMenu } from './ContextMenu'
import { GlobalSettings } from './GlobalSettings'
import { PanelFooter } from './PanelFooter'
import { PanelHeader } from './PanelHeader'
import { PanelShell } from './PanelShell'
import { ProjectSection } from './ProjectSection'
import { ProjectSettings } from './ProjectSettings'

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
  const panelStyle: CSSVars = { '--accent': accent, '--accent-soft': hexA(accent, 0.1) }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleProjectDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) state.reorderProjects(String(active.id), String(over.id))
  }

  if (state.settingsProject) {
    return (
      <div
        onContextMenu={(event) => event.preventDefault()}
        style={panelStyle}
        className="glass-surface relative flex h-screen w-screen origin-top animate-panel-in flex-col overflow-hidden rounded-[var(--window-radius)] border-[0.5px] p-1.5 font-sans text-[13.5px] text-[#1c1c1e] antialiased shadow-panel"
      >
        <ScrollArea>
          <ProjectSettings
            project={state.settingsProject}
            onSave={state.saveProjectSettings}
            onClose={() => state.setSettingsFor(null)}
          />
        </ScrollArea>
      </div>
    )
  }

  if (state.globalSettingsOpen) {
    return (
      <div
        onContextMenu={(event) => event.preventDefault()}
        style={panelStyle}
        className="glass-surface relative flex h-screen w-screen origin-top animate-panel-in flex-col overflow-hidden rounded-[var(--window-radius)] border-[0.5px] p-1.5 font-sans text-[13.5px] text-[#1c1c1e] antialiased shadow-panel"
      >
        <ScrollArea>
          <GlobalSettings
            settings={state.appSettings}
            saving={state.appSettingsSaving}
            onGhosttyOpenModeChange={(openInTabs) =>
              state.setGhosttyOpenMode(openInTabs ? 'tab' : 'window')
            }
            onClose={() => state.setGlobalSettingsOpen(false)}
          />
        </ScrollArea>
      </div>
    )
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
      footer={<PanelFooter onQuit={onQuit} />}
    >
      {state.projects.length === 0 ? (
        <EmptyProjectList onAddProject={state.addProject} />
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
              />
            ))}
          </SortableContext>
        </DndContext>
      )}

      {state.toast && (
        <Toast
          tone={state.toast.tone}
          icon={
            state.toast.tone === 'progress' ? (
              <Spinner className="shrink-0 animate-spin text-[#7fb4ff]" />
            ) : null
          }
        >
          {state.toast.message}
        </Toast>
      )}

      {state.ctx && (
        <ContextMenu
          ctx={state.ctx}
          onClose={() => state.setCtx(null)}
          onRunCommand={state.runCommand}
          onArchive={state.archiveWorktree}
          onOpenWorkspace={state.openWorktree}
          onEditCommands={(project) => {
            state.setCtx(null)
            state.setSettingsFor(project.id)
          }}
        />
      )}
    </PanelShell>
  )
}

function EmptyProjectList({ onAddProject }: { onAddProject: () => void }) {
  return (
    <div className="flex min-h-full items-center justify-center px-6 py-10 text-center">
      <p className="text-[13px] leading-5 text-black/45">
        No projects.{' '}
        <Button
          onPress={onAddProject}
          size="sm"
          variant="ghost"
          className="inline h-auto min-w-0 bg-transparent p-0 align-baseline font-medium text-accent underline underline-offset-2 outline-none transition-colors hover:bg-transparent hover:text-[#1c1c1e] focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
        >
          Add a project
        </Button>
        .
      </p>
    </div>
  )
}
