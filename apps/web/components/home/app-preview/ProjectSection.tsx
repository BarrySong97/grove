/* Faithful project group port — collapse animation, hover controls, new-worktree row. */
'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ChevronRight, ChevronUp, ChevronDown, Gear, Plus, ToTop, Dot, Divider, IconButton } from '@grove/ui'
import type { Project } from './data'
import { WorktreeRow } from './WorktreeRow'

const VISIBLE_LIMIT = 3
const collapseTransition = { duration: 0.22, ease: [0.4, 0, 0.2, 1] as const }

export function ProjectSection({
  project,
  collapsed,
  isFirst,
  isLast,
  onToggle,
}: {
  project: Project
  collapsed: boolean
  isFirst: boolean
  isLast: boolean
  onToggle: () => void
}) {
  const [showAll, setShowAll] = useState(false)
  const hasOverflow = project.worktrees.length > VISIBLE_LIMIT
  const head = project.worktrees.slice(0, VISIBLE_LIMIT)
  const rest = project.worktrees.slice(VISIBLE_LIMIT)

  const renderRow = (index: number) => (
    <WorktreeRow
      key={project.worktrees[index].id}
      worktree={project.worktrees[index]}
      isFirst={index === 0}
      isLast={index === project.worktrees.length - 1}
    />
  )

  return (
    <div className="group/proj relative">
      <div className="px-2.5 py-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggle}
            className="grove-icon-scale flex h-auto min-w-0 flex-1 cursor-pointer items-center justify-start gap-2 rounded-md p-0 text-left"
          >
            <motion.span
              className="flex w-3 shrink-0 items-center justify-center text-black/30"
              animate={{ rotate: collapsed ? 0 : 90 }}
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
            <IconButton title="New worktree" size="project" tone="accent">
              <Plus />
            </IconButton>
          </div>
        </div>

        <div className="truncate pt-[5px] font-mono text-[10.5px] leading-none text-black/55">
          {project.path}
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

            <button
              type="button"
              className="mt-px flex w-full cursor-pointer items-center gap-[11px] rounded-[9px] px-2.5 py-2 transition-colors hover:bg-black/[0.038]"
            >
              <span className="flex w-4 shrink-0 items-center justify-center text-[var(--accent)]">
                <Plus />
              </span>
              <span className="flex-1 text-left text-[12.5px] font-medium text-[#1c1c1e]">
                New Worktree…
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {!isLast && <Divider />}
    </div>
  )
}
