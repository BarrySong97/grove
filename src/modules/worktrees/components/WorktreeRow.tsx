/**
 * @purpose Renders a sortable worktree row with status subtitle and hover actions.
 * @role    Row-level UI for branch metadata, busy state, move controls, and context menu trigger.
 * @deps    @dnd-kit/sortable, Worktrees model selectors, shared icons/ui
 * @gotcha  Busy rows suppress context/actions to avoid conflicting simulated operations; docs/modules/worktrees/README.md
 */
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { animateLayoutChanges, sortableTransition } from '../../../shared/lib/sortable'
import type { Density, Project, Worktree } from '../model'
import { getBusyLabel, isWorktreeBusy } from '../model'
import {
  ChevronDown,
  ChevronUp,
  Editor,
  More,
  Spinner,
  Terminal,
  ToTop
} from '../../../shared/icons'
import { IconButton } from '../../../shared/ui/IconButton'

interface WorktreeRowProps {
  worktree: Worktree
  project: Project
  density: Density
  showCommit: boolean
  isFirst: boolean
  isLast: boolean
  onMove: (direction: 'up' | 'down' | 'top') => void
  onContext: (event: React.MouseEvent, worktree: Worktree, project: Project) => void
}

export function WorktreeRow({
  worktree,
  project,
  density,
  showCommit,
  isFirst,
  isLast,
  onMove,
  onContext
}: WorktreeRowProps) {
  const running = isWorktreeBusy(worktree)
  const padY = density === 'compact' ? 'py-1.5' : 'py-[9px]'
  const gap = density === 'compact' ? 'gap-2' : 'gap-[11px]'

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: worktree.id,
    animateLayoutChanges,
    transition: sortableTransition
  })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      onContextMenu={(event) => {
        event.preventDefault()
        if (!running) onContext(event, worktree, project)
      }}
      {...attributes}
      {...listeners}
      className={
        `group relative mb-[3px] flex items-center ${gap} ${padY} rounded-[9px] px-2.5 transition-colors ` +
        (isDragging
          ? 'z-10 bg-black/[0.05] opacity-80 active:cursor-grabbing '
          : 'hover:bg-black/[0.038] active:bg-black/[0.07] ')
      }
    >
      <span className="flex w-4 shrink-0 items-center justify-center">
        <span className="h-1.5 w-1.5 rounded-full bg-black/[0.22]" />
      </span>

      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate font-mono text-[12.5px] font-medium tracking-[-0.1px] text-[#1c1c1e]">
          {worktree.branch}
        </span>
        <WorktreeSubtitle worktree={worktree} running={running} showCommit={showCommit} />
      </span>

      {!running && (
        <div className="hidden shrink-0 items-center gap-0.5 group-hover:flex">
          {!isFirst && (
            <IconButton
              title="Move to top"
              onClick={(event) => {
                event.stopPropagation()
                onMove('top')
              }}
            >
              <ToTop />
            </IconButton>
          )}
          {!isFirst && (
            <IconButton
              title="Move up"
              onClick={(event) => {
                event.stopPropagation()
                onMove('up')
              }}
            >
              <ChevronUp />
            </IconButton>
          )}
          {!isLast && (
            <IconButton
              title="Move down"
              onClick={(event) => {
                event.stopPropagation()
                onMove('down')
              }}
            >
              <ChevronDown />
            </IconButton>
          )}
          <IconButton title="Open in editor" onClick={(event) => event.stopPropagation()}>
            <Editor />
          </IconButton>
          <IconButton title="Open in terminal" onClick={(event) => event.stopPropagation()}>
            <Terminal />
          </IconButton>
          <IconButton
            title="More…"
            onClick={(event) => {
              event.stopPropagation()
              onContext(event, worktree, project)
            }}
          >
            <More />
          </IconButton>
        </div>
      )}
    </div>
  )
}

function WorktreeSubtitle({
  worktree,
  running,
  showCommit
}: {
  worktree: Worktree
  running: boolean
  showCommit: boolean
}) {
  if (running) {
    return (
      <span className="flex items-center gap-1.5 truncate text-[11px] font-medium text-accent">
        <Spinner className="animate-spin" /> {getBusyLabel(worktree)}
      </span>
    )
  }

  if (showCommit) {
    return (
      <span className="truncate text-[11px] text-black/[0.34]">
        {worktree.message} <span className="text-black/[0.22]">· {worktree.time}</span>
      </span>
    )
  }

  return (
    <span className="truncate text-[11px] text-black/[0.34]">
      {worktree.base ? `from ${worktree.base}` : 'primary branch'} · {worktree.time}
    </span>
  )
}
