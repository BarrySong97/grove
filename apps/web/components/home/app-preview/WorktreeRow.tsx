/* Faithful row port — hover actions use real open-target app icons (cursor/terminal). */
import { ChevronDown, ChevronUp, More, Spinner, ToTop, IconButton } from '@grove/ui'
import type { OpenWorkspaceTarget } from '@grove/ui'
import type { Worktree } from './data'
import { OpenTargetIcon } from './OpenTargetIcon'

const QUICK_OPEN_LABEL: Partial<Record<OpenWorkspaceTarget, string>> = {
  cursor: 'Open in Cursor',
  terminal: 'Open in Terminal',
  finder: 'Reveal in Finder',
  vs_code: 'Open in VS Code',
  ghostty: 'Open in Ghostty',
  zed: 'Open in Zed',
}

const DEFAULT_QUICK_OPEN: OpenWorkspaceTarget[] = ['cursor', 'terminal']

export function WorktreeRow({
  worktree,
  isFirst,
  isLast,
}: {
  worktree: Worktree
  isFirst: boolean
  isLast: boolean
}) {
  const running = worktree.status === 'setting-up' || worktree.status === 'archiving'

  return (
    <div className="group relative mb-[3px] flex items-center gap-[11px] rounded-[9px] px-2.5 py-[9px] transition-colors hover:bg-black/[0.038] active:bg-black/[0.07]">
      <span className="flex w-4 shrink-0 items-center justify-center">
        <span className="h-1.5 w-1.5 rounded-full bg-black/[0.22]" />
      </span>

      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate font-mono text-[12.5px] font-medium tracking-[-0.1px] text-[#1c1c1e]">
          {worktree.branch}
        </span>
        <WorktreeSubtitle worktree={worktree} running={running} />
      </span>

      {!running && (
        <div className="hidden shrink-0 items-center gap-0.5 group-hover:flex">
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
          {DEFAULT_QUICK_OPEN.map((target) => (
            <IconButton key={target} title={QUICK_OPEN_LABEL[target] ?? 'Open'}>
              <OpenTargetIcon target={target} />
            </IconButton>
          ))}
          <IconButton title="More">
            <More />
          </IconButton>
        </div>
      )}
    </div>
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
