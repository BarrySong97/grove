/* Faithful row port — hover actions use real open-target app icons (Ghostty / VS Code). */
import { motion } from 'motion/react'
import { ChevronDown, ChevronUp, More, Spinner, ToTop, IconButton } from '@grove/ui'
import type { OpenWorkspaceTarget } from '@grove/ui'
import type { AppPreviewDemoPhase, Worktree, WorktreeStatus } from './data'
import { OpenTargetIcon } from './OpenTargetIcon'

const QUICK_OPEN_LABEL: Partial<Record<OpenWorkspaceTarget, string>> = {
  cursor: 'Open in Cursor',
  terminal: 'Open in Terminal',
  finder: 'Reveal in Finder',
  vs_code: 'Open in VS Code',
  ghostty: 'Open in Ghostty',
  zed: 'Open in Zed',
}

const DEFAULT_QUICK_OPEN: OpenWorkspaceTarget[] = ['ghostty', 'vs_code']
const pressTransition = { duration: 0.16, ease: [0.22, 1, 0.36, 1] as const }

const demoActionAnimation = (active: boolean, phase: AppPreviewDemoPhase) => {
  if (!active || phase === 'idle') return { scale: 1 }
  if (phase === 'press') return { scale: 0.9 }
  return { scale: 1 }
}

const demoActionClassName = (active: boolean, phase: AppPreviewDemoPhase) => {
  if (!active || phase === 'idle') return ''
  return phase === 'press' ? 'bg-black/[0.07] text-black/90' : 'bg-black/[0.038] text-black/85'
}

export function WorktreeRow({
  worktree,
  isFirst,
  isLast,
  demoStatus,
  forceActionsVisible = false,
  demoPhase = 'idle',
  demoPressedAction,
  revealDelay,
}: {
  worktree: Worktree
  isFirst: boolean
  isLast: boolean
  demoStatus?: WorktreeStatus
  forceActionsVisible?: boolean
  demoPhase?: AppPreviewDemoPhase
  demoPressedAction?: OpenWorkspaceTarget
  revealDelay?: number
}) {
  const displayWorktree = demoStatus
    ? { ...worktree, status: demoStatus, message: demoStatus === 'setting-up' ? '' : worktree.message }
    : worktree
  const running = displayWorktree.status === 'setting-up' || displayWorktree.status === 'archiving'

  return (
    <motion.div
      className="group relative mb-[3px] flex items-center gap-[11px] overflow-hidden rounded-[9px] px-2.5 py-[9px] transition-colors hover:bg-black/[0.038] active:bg-black/[0.07]"
      initial={revealDelay === undefined ? false : { height: 0, opacity: 0, y: -6 }}
      animate={{ height: 'auto', opacity: 1, y: 0 }}
      transition={{
        duration: 0.28,
        delay: revealDelay ?? 0,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      <span className="flex w-4 shrink-0 items-center justify-center">
        <span className="h-1.5 w-1.5 rounded-full bg-black/[0.22]" />
      </span>

      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate font-mono text-[12.5px] font-medium tracking-[-0.1px] text-[#1c1c1e]">
          {worktree.branch}
        </span>
        <WorktreeSubtitle worktree={displayWorktree} running={running} />
      </span>

      {!running && (
        <div
          className={
            (forceActionsVisible ? 'flex' : 'hidden group-hover:flex') +
            ' shrink-0 items-center gap-0.5'
          }
        >
          {!isFirst && (
            <IconButton title="Move to top">
              <ToTop />
            </IconButton>
          )}
          {!isFirst && (
            <IconButton title="Move up">
              <ChevronUp />
            </IconButton>
          )}
          {!isLast && (
            <IconButton title="Move down">
              <ChevronDown />
            </IconButton>
          )}
          {DEFAULT_QUICK_OPEN.map((target) => {
            const pressed = demoPressedAction === target
            return (
              <motion.span
                key={target}
                className="inline-flex"
                animate={demoActionAnimation(pressed, demoPhase)}
                transition={pressTransition}
              >
                <IconButton
                  title={QUICK_OPEN_LABEL[target] ?? 'Open'}
                  className={demoActionClassName(pressed, demoPhase)}
                >
                  <OpenTargetIcon target={target} />
                </IconButton>
              </motion.span>
            )
          })}
          <IconButton title="More">
            <More />
          </IconButton>
        </div>
      )}
    </motion.div>
  )
}

function WorktreeSubtitle({ worktree, running }: { worktree: Worktree; running: boolean }) {
  if (running) {
    const label = worktree.status === 'setting-up' ? 'Setting up…' : 'Archiving…'
    return (
      <span className="flex items-center gap-1.5 truncate text-[11px] font-medium text-[var(--accent)]">
        <Spinner className="animate-spin" /> {label}
      </span>
    )
  }
  if (worktree.status === 'failed') {
    return <span className="truncate text-[11px] font-medium text-red-500">Failed to set up</span>
  }
  return (
    <span className="truncate text-[11px] text-black/[0.34]">
      {worktree.message} <span className="text-black/[0.22]">· {worktree.time}</span>
    </span>
  )
}
