/**
 * @purpose Composes the full Grove worktree panel UI.
 * @role    Feature root component; wires state hook, project sorting, settings, toast, and context menu.
 * @deps    @dnd-kit/core/sortable, Worktrees model/state, shared UI/lib/icons
 * @gotcha  Panel shell transparency and settings view share the same glass surface constraints; docs/modules/worktrees/README.md
 */
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'
import type { Density, Project } from '../model'
import { INITIAL_PROJECTS } from '../model'
import { useWorktreePanelState } from '../hooks/useWorktreePanelState'
import { sortableMeasuring } from '../../../shared/lib/sortable'
import { hexA } from '../../../shared/lib/color'
import type { CSSVars } from '../../../shared/lib/styles'
import { Spinner } from '../../../shared/icons'
import { ScrollArea } from '../../../shared/ui/ScrollArea'
import { Toast } from '../../../shared/ui/Toast'
import { ContextMenu } from './ContextMenu'
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
  initialProjects = INITIAL_PROJECTS,
  onQuit,
}: WorktreePanelProps) {
  const state = useWorktreePanelState(initialProjects)
  const panelStyle: CSSVars = { '--accent': accent, '--accent-soft': hexA(accent, 0.1) }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
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
            onChange={state.setCommands}
            onClose={() => state.setSettingsFor(null)}
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
          onAddProject={() => state.flash('Add project · choose a folder')}
        />
      }
      footer={<PanelFooter onQuit={onQuit} />}
    >
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        measuring={sortableMeasuring}
        modifiers={[restrictToVerticalAxis]}
        onDragEnd={handleProjectDragEnd}
      >
        <SortableContext items={state.projects.map((project) => project.id)} strategy={verticalListSortingStrategy}>
          {state.projects.map((project, index) => (
            <ProjectSection
              key={project.id}
              project={project}
              density={density}
              showCommit={showCommit}
              isAdding={state.addingTo === project.id}
              isFirst={index === 0}
              isLast={index === state.projects.length - 1}
              onAddWorktree={state.setAddingTo}
              onCancelAdd={() => state.setAddingTo(null)}
              onCreateWorktree={state.createWorktree}
              onEditSettings={state.setSettingsFor}
              onMove={(direction) => state.moveProject(project.id, direction)}
              onMoveWorktree={(worktreeId, direction) => state.moveWorktree(project.id, worktreeId, direction)}
              onReorderWorktrees={(activeId, overId) => state.reorderWorktrees(project.id, activeId, overId)}
              onContext={(event, worktree, item) =>
                state.setCtx({ x: event.clientX, y: event.clientY, worktree, project: item })
              }
            />
          ))}
        </SortableContext>
      </DndContext>

      {state.toast && <Toast icon={<Spinner className="animate-spin text-[#7fb4ff]" />}>{state.toast}</Toast>}

      {state.ctx && (
        <ContextMenu
          ctx={state.ctx}
          onClose={() => state.setCtx(null)}
          onRunCommand={state.runCommand}
          onArchive={state.archiveWorktree}
          onEditCommands={(project) => {
            state.setCtx(null)
            state.setSettingsFor(project.id)
          }}
        />
      )}
    </PanelShell>
  )
}
