/* Faithful project group port — collapse animation, hover controls, new-worktree row. */
'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ChevronRight, ChevronUp, ChevronDown, Gear, Plus, ToTop, Dot, IconButton } from '@grove/ui'
import {
  SCRIPTED_PROJECT_ID,
  SCRIPTED_WORKTREE_ID,
  type AppPreviewDemoPhase,
  type AppPreviewDemoStep,
  type Project,
} from './data'
import { WorktreeRow } from './WorktreeRow'

const VISIBLE_LIMIT = 3
const collapseTransition = { duration: 0.22, ease: [0.4, 0, 0.2, 1] as const }
const pressTransition = { duration: 0.3, delay: 1.02, ease: [0.22, 1, 0.36, 1] as const }
const demoPressTransition = { duration: 0.16, ease: [0.22, 1, 0.36, 1] as const }

const demoButtonAnimation = (active: boolean, phase: AppPreviewDemoPhase) => {
  if (!active || phase === 'idle') return { scale: 1, backgroundColor: 'rgba(0,0,0,0)' }
  if (phase === 'press') return { scale: 0.965, backgroundColor: 'rgba(0,0,0,0.07)' }
  return { scale: 1, backgroundColor: 'rgba(0,0,0,0.038)' }
}

export function ProjectSection({
  project,
  collapsed,
  isFirst,
  isLast,
  onToggle,
  onNewWorktree,
  demoPhase = 'idle',
  demoStep,
  revealDelay,
  forceExpanded = false,
}: {
  project: Project
  collapsed: boolean
  isFirst: boolean
  isLast: boolean
  onToggle: () => void
  onNewWorktree?: (projectId: string) => void
  demoPhase?: AppPreviewDemoPhase
  demoStep?: AppPreviewDemoStep
  revealDelay?: number
  forceExpanded?: boolean
}) {
  const [showAll, setShowAll] = useState(false)
  const collapsedState = forceExpanded ? false : collapsed
  const hasOverflow = project.worktrees.length > VISIBLE_LIMIT
  const head = project.worktrees.slice(0, VISIBLE_LIMIT)
  const rest = project.worktrees.slice(VISIBLE_LIMIT)
  const newWorktreePressed = demoStep === 'create-worktree' && project.id === SCRIPTED_PROJECT_ID
  const newWorktreeClasses = 'mt-px flex w-full cursor-pointer items-center gap-[11px] rounded-[9px] px-2.5 py-2'

  const renderRow = (index: number) => {
    const worktree = project.worktrees[index]
    const highlightCreate =
      demoStep === 'create-worktree' &&
      project.id === SCRIPTED_PROJECT_ID &&
      worktree.id === SCRIPTED_WORKTREE_ID
    const highlightOpen =
      demoStep === 'open-archive' &&
      project.id === SCRIPTED_PROJECT_ID &&
      worktree.id === SCRIPTED_WORKTREE_ID

    return (
      <WorktreeRow
        key={worktree.id}
        worktree={worktree}
        isFirst={index === 0}
        isLast={index === project.worktrees.length - 1}
        demoStatus={highlightCreate ? 'setting-up' : undefined}
        forceActionsVisible={highlightOpen && demoPhase !== 'idle'}
        demoPhase={demoPhase}
        demoPressedAction={highlightOpen ? 'ghostty' : undefined}
        revealDelay={highlightCreate ? 0 : undefined}
      />
    )
  }

  return (
    <motion.div
      className={'relative' + (isFirst ? '' : ' pt-2')}
      initial={revealDelay === undefined ? false : { height: 0, opacity: 0, y: -8 }}
      animate={{ height: 'auto', opacity: 1, y: 0 }}
      transition={{
        duration: 0.28,
        delay: revealDelay ?? 0,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      <div className="group/proj rounded-[10px] transition-colors hover:bg-black/[0.038]">
      <div className="px-2.5 py-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggle}
            className="grove-icon-scale flex h-auto min-w-0 flex-1 cursor-pointer items-center justify-start gap-2 rounded-md p-0 text-left"
          >
            <motion.span
              className="flex w-3 shrink-0 items-center justify-center text-black/30"
              animate={{ rotate: collapsedState ? 0 : 90 }}
              transition={collapseTransition}
            >
              <ChevronRight />
            </motion.span>
            <Dot color={project.accent} />
            <span className="min-w-0 flex-1 truncate whitespace-nowrap text-[12px] font-semibold tracking-[0.2px]">
              {project.name}
            </span>
          </button>

          <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover/proj:opacity-100">
            {!isFirst && (
              <IconButton title="Move to top" size="project">
                <ToTop />
              </IconButton>
            )}
            {!isFirst && (
              <IconButton title="Move up" size="project">
                <ChevronUp />
              </IconButton>
            )}
            {!isLast && (
              <IconButton title="Move down" size="project">
                <ChevronDown />
              </IconButton>
            )}
            <IconButton title="Project settings" size="project">
              <Gear />
            </IconButton>
            <IconButton
              title="New worktree"
              size="project"
              tone="accent"
              onClick={() => onNewWorktree?.(project.id)}
            >
              <Plus />
            </IconButton>
          </div>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {!collapsedState && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={collapseTransition}
            className="overflow-hidden"
          >
            {head.map((_, index) => renderRow(index))}

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
                  {rest.map((_, index) => renderRow(index + VISIBLE_LIMIT))}
                </motion.div>
              )}
            </AnimatePresence>

            {hasOverflow && (
              <button
                type="button"
                onClick={() => setShowAll((value) => !value)}
                className="mt-px flex w-full cursor-pointer items-center gap-[11px] rounded-[9px] px-2.5 py-2 text-[12.5px] font-medium text-black/50 transition-colors hover:bg-black/[0.038]"
              >
                <span className="flex w-4 shrink-0 items-center justify-center" />
                <span className="flex-1 text-left">
                  {showAll ? 'Show less' : `Show all (${rest.length})`}
                </span>
              </button>
            )}

            <motion.button
              type="button"
              onClick={() => onNewWorktree?.(project.id)}
              className={newWorktreeClasses}
              animate={demoButtonAnimation(newWorktreePressed, demoPhase)}
              transition={
                newWorktreePressed
                  ? demoPressTransition
                  : pressTransition
              }
            >
              <span className="flex w-4 shrink-0 items-center justify-center text-[var(--accent)]">
                <Plus />
              </span>
              <span className="flex-1 text-left text-[12.5px] font-medium text-[#1c1c1e]">
                New Worktree…
              </span>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </motion.div>
  )
}
