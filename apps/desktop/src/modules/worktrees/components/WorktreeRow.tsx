/**
 * @purpose Renders a sortable worktree row with status subtitle and hover/menu-pinned actions.
 * @role    Row-level UI for branch metadata, busy state, move controls, and context menu trigger.
 * @deps    @dnd-kit/sortable, react-i18next, generated open target DTO, Worktrees contracts/domain rules, shared icons/ui
 * @gotcha  Busy rows suppress context/actions; menu-open rows keep actions visible; docs/modules/worktrees/README.md
 */
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useTranslation } from 'react-i18next'
import { animateLayoutChanges, sortableTransition } from '../../../shared/lib/sortable'
import type { OpenWorkspaceTargetDto } from '../../../shared/bindings/commands'
import type { Density, Project, Worktree } from '../../../shared/contracts/worktrees'
import { ChevronDown, ChevronUp, More, Spinner, ToTop } from '../../../shared/icons'
import { IconButton } from '../../../shared/ui/IconButton'
import { isWorktreeBusy } from '../domain/worktree-rules'
import { openTargetDisplayLabel } from '../domain/open-targets'
import { OpenTargetIcon } from './OpenTargetIcon'

interface WorktreeRowProps {
  worktree: Worktree
  project: Project
  density: Density
  showCommit: boolean
  isContextOpen: boolean
  isFirst: boolean
  isLast: boolean
  hoverQuickOpenTargets: OpenWorkspaceTargetDto[]
  onMove: (direction: 'up' | 'down' | 'top') => void
  onContext: (event: React.MouseEvent, worktree: Worktree, project: Project) => void
  onOpen: (target: OpenWorkspaceTargetDto) => void
}

export function WorktreeRow({
  worktree,
  project,
  density,
  showCommit,
  isContextOpen,
  isFirst,
  isLast,
  hoverQuickOpenTargets,
  onMove,
  onContext,
  onOpen
}: WorktreeRowProps) {
  const { t } = useTranslation()
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
          : isContextOpen
            ? 'bg-black/[0.038] active:bg-black/[0.07] '
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
        <div
          className={`shrink-0 items-center gap-0.5 ${isContextOpen ? 'flex' : 'hidden group-hover:flex'}`}
        >
          {!isFirst && (
            <IconButton
              title={t('actions.moveToTop')}
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
              title={t('actions.moveUp')}
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
              title={t('actions.moveDown')}
              onClick={(event) => {
                event.stopPropagation()
                onMove('down')
              }}
            >
              <ChevronDown />
            </IconButton>
          )}
          {hoverQuickOpenTargets.map((target) => (
            <IconButton
              key={target}
              title={
                target === 'finder'
                  ? t('actions.revealInFinder')
                  : t('actions.openIn', { target: openTargetDisplayLabel(target) })
              }
              onClick={(event) => {
                event.stopPropagation()
                onOpen(target)
              }}
            >
              <OpenTargetIcon target={target} />
            </IconButton>
          ))}
          <IconButton
            title={t('actions.more')}
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
  const { t } = useTranslation()

  if (running) {
    const label =
      worktree.status === 'setting-up' ? t('worktree.runningSetup') : t('worktree.archiving')
    return (
      <span className="flex items-center gap-1.5 truncate text-[11px] font-medium text-accent">
        <Spinner className="animate-spin" /> {label}
      </span>
    )
  }

  if (worktree.status === 'failed') {
    return (
      <span className="truncate text-[11px] font-medium text-red-500">
        {t('worktree.failedSubtitle')}
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
      {worktree.base ? `${t('worktree.from')} ${worktree.base}` : t('worktree.primaryBranch')} ·{' '}
      {worktree.time}
    </span>
  )
}
