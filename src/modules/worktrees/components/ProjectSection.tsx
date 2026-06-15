/**
 * @purpose Renders one project group with collapsible worktree rows and project controls.
 * @role    Sortable project section inside WorktreePanel; owns local collapse/show-all UI state.
 * @deps    React state, motion, @dnd-kit, shared icons/ui, WorktreeRow, NewWorktreeEditor
 * @gotcha  VISIBLE_LIMIT controls collapsed preview; activeContextWorktreeId pins row actions; docs/modules/worktrees/README.md
 */
import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent
} from '@dnd-kit/core'
import { restrictToParentElement, restrictToVerticalAxis } from '@dnd-kit/modifiers'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  animateLayoutChanges,
  sortableMeasuring,
  sortableTransition
} from '../../../shared/lib/sortable'
import type { Density, Project, Worktree } from '../../../shared/contracts/worktrees'
import { ChevronDown, ChevronRight, ChevronUp, Gear, Plus, ToTop } from '../../../shared/icons'
import { Divider } from '../../../shared/ui/Divider'
import { Dot } from '../../../shared/ui/Dot'
import { IconButton } from '../../../shared/ui/IconButton'
import { NewWorktreeEditor } from './NewWorktreeEditor'
import { WorktreeRow } from './WorktreeRow'

const VISIBLE_LIMIT = 3
const collapseTransition = { duration: 0.22, ease: [0.4, 0, 0.2, 1] as const }

interface ProjectSectionProps {
  project: Project
  density: Density
  showCommit: boolean
  isAdding: boolean
  activeContextWorktreeId: string | null
  isFirst: boolean
  isLast: boolean
  onAddWorktree: (projectId: string) => void
  onCancelAdd: () => void
  onCreateWorktree: (project: Project, name: string, base: string) => void
  onEditSettings: (projectId: string) => void
  onMove: (direction: 'up' | 'down' | 'top') => void
  onMoveWorktree: (worktreeId: string, direction: 'up' | 'down' | 'top') => void
  onReorderWorktrees: (activeId: string, overId: string) => void
  onContext: (event: React.MouseEvent, worktree: Worktree, project: Project) => void
}

export function ProjectSection({
  project,
  density,
  showCommit,
  isAdding,
  activeContextWorktreeId,
  isFirst,
  isLast,
  onAddWorktree,
  onCancelAdd,
  onCreateWorktree,
  onEditSettings,
  onMove,
  onMoveWorktree,
  onReorderWorktrees,
  onContext
}: ProjectSectionProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const hasOverflow = project.worktrees.length > VISIBLE_LIMIT
  const head = project.worktrees.slice(0, VISIBLE_LIMIT)
  const rest = project.worktrees.slice(VISIBLE_LIMIT)
  const rendered = showAll ? project.worktrees : head

  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: project.id,
    animateLayoutChanges,
    transition: sortableTransition
  })

  const worktreeSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleWorktreeDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) onReorderWorktrees(String(active.id), String(over.id))
  }

  const renderRow = (worktree: Worktree, index: number) => (
    <WorktreeRow
      key={worktree.id}
      worktree={worktree}
      project={project}
      density={density}
      showCommit={showCommit}
      isContextOpen={activeContextWorktreeId === worktree.id}
      isFirst={index === 0}
      isLast={index === project.worktrees.length - 1}
      onMove={(direction) => onMoveWorktree(worktree.id, direction)}
      onContext={onContext}
    />
  )

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={'group/proj relative' + (isDragging ? ' z-10 opacity-80' : '')}
    >
      <div className="flex items-center gap-2 px-2.5 py-2">
        <button
          ref={setActivatorNodeRef}
          type="button"
          onClick={() => setCollapsed((value) => !value)}
          className="flex min-w-0 flex-1 items-center gap-2 text-left active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <motion.span
            className="flex w-3 shrink-0 items-center justify-center text-black/30"
            animate={{ rotate: collapsed ? 0 : 90 }}
            transition={collapseTransition}
          >
            <ChevronRight />
          </motion.span>
          <Dot color={project.accent} />
          <span className="whitespace-nowrap text-[12px] font-semibold tracking-[0.2px]">
            {project.name}
          </span>
        </button>

        <div className="relative flex shrink-0 items-center">
          <span className="truncate font-mono text-[10.5px] text-black/[0.22] transition-opacity group-hover/proj:opacity-0">
            {project.path}
          </span>
          <div className="absolute right-0 top-1/2 flex -translate-y-1/2 items-center gap-1 opacity-0 transition-opacity group-hover/proj:opacity-100">
            {!isFirst && (
              <IconButton title="Move to top" size="project" onClick={() => onMove('top')}>
                <ToTop />
              </IconButton>
            )}
            {!isFirst && (
              <IconButton title="Move up" size="project" onClick={() => onMove('up')}>
                <ChevronUp />
              </IconButton>
            )}
            {!isLast && (
              <IconButton title="Move down" size="project" onClick={() => onMove('down')}>
                <ChevronDown />
              </IconButton>
            )}
            <IconButton
              title="Project settings"
              size="project"
              onClick={() => onEditSettings(project.id)}
            >
              <Gear />
            </IconButton>
            <IconButton
              title="New worktree"
              size="project"
              tone="accent"
              onClick={() => {
                setCollapsed(false)
                onAddWorktree(project.id)
              }}
            >
              <Plus />
            </IconButton>
          </div>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={collapseTransition}
            className="overflow-hidden"
          >
            <DndContext
              sensors={worktreeSensors}
              collisionDetection={closestCenter}
              measuring={sortableMeasuring}
              modifiers={[restrictToVerticalAxis, restrictToParentElement]}
              onDragEnd={handleWorktreeDragEnd}
            >
              <SortableContext
                items={rendered.map((worktree) => worktree.id)}
                strategy={verticalListSortingStrategy}
              >
                {head.map((worktree, index) => renderRow(worktree, index))}

                <AnimatePresence initial={false}>
                  {showAll && rest.length > 0 && (
                    <motion.div
                      key="rest"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={collapseTransition}
                      className="overflow-hidden"
                    >
                      {rest.map((worktree, index) => renderRow(worktree, index + VISIBLE_LIMIT))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </SortableContext>
            </DndContext>

            {hasOverflow && (
              <div
                onClick={() => setShowAll((value) => !value)}
                className="mt-px flex items-center gap-[11px] rounded-[9px] px-2.5 py-2 text-[12.5px] font-medium text-black/50 transition-colors hover:bg-black/[0.038]"
              >
                <span className="flex w-4 shrink-0 items-center justify-center" />
                <span className="flex-1">
                  {showAll ? 'Show less' : `Show all work tree (${rest.length} more)`}
                </span>
              </div>
            )}

            {isAdding ? (
              <NewWorktreeEditor
                project={project}
                onCreate={onCreateWorktree}
                onCancel={onCancelAdd}
              />
            ) : (
              <div
                onClick={() => onAddWorktree(project.id)}
                className="mt-px flex items-center gap-[11px] rounded-[9px] px-2.5 py-2 text-black/50 transition-colors hover:bg-black/[0.038]"
              >
                <span className="flex w-4 shrink-0 items-center justify-center text-accent">
                  <Plus />
                </span>
                <span className="flex-1 text-[12.5px] font-medium text-[#1c1c1e]">
                  New worktree
                </span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {!isLast && <Divider />}
    </div>
  )
}
