/**
 * @purpose Renders the worktree context menu and command submenu.
 * @role    Floating menu for row actions, command simulation, copy path, and archive trigger.
 * @deps    React effect/ref/state, Worktrees model, shared icons/ui
 * @gotcha  Menu position is clamped to viewport and most actions are prototype placeholders; docs/modules/worktrees/README.md
 */
import { useEffect, useRef, useState } from 'react'
import type { CommandDef, Project, Worktree } from '../model'
import { COMMANDS } from '../model'
import {
  Archive,
  ChevronRight,
  Copy,
  Editor,
  Finder,
  Gear,
  Play,
  Terminal
} from '../../../shared/icons'
import { MenuItem, MenuSeparator } from '../../../shared/ui/MenuItem'

export interface ContextState {
  x: number
  y: number
  worktree: Worktree
  project: Project
}

interface ContextMenuProps {
  ctx: ContextState
  onClose: () => void
  onRunCommand: (command: CommandDef, worktree: Worktree, project: Project) => void
  onArchive: (worktree: Worktree, project: Project) => void
  onEditCommands: (project: Project) => void
}

export function ContextMenu({
  ctx,
  onClose,
  onRunCommand,
  onArchive,
  onEditCommands
}: ContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [subOpen, setSubOpen] = useState(false)
  const { worktree, project } = ctx

  useEffect(() => {
    const onDown = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) onClose()
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [onClose])

  const left = Math.min(ctx.x, window.innerWidth - 244)
  const top = Math.min(ctx.y, window.innerHeight - 372)

  return (
    <div
      ref={ref}
      style={{ left, top }}
      className="glass-surface fixed z-50 w-[230px] animate-panel-in rounded-[11px] border-[0.5px] p-1.5 font-sans text-[13px] text-[#1c1c1e] shadow-ctx"
    >
      <div className="truncate px-2.5 pb-1.5 pt-1.5 font-mono text-[10.5px] font-semibold text-black/[0.34]">
        {worktree.branch}
      </div>

      <MenuItem
        icon={<Editor />}
        label="Open in Editor"
        kbd="↵"
        onHover={() => setSubOpen(false)}
        onClick={onClose}
      />
      <MenuItem
        icon={<Terminal />}
        label="Open in Terminal"
        onHover={() => setSubOpen(false)}
        onClick={onClose}
      />
      <MenuItem
        icon={<Finder />}
        label="Reveal in Finder"
        onHover={() => setSubOpen(false)}
        onClick={onClose}
      />

      <MenuSeparator />

      <div
        onMouseEnter={() => setSubOpen(true)}
        className="group/menu-item relative flex h-[30px] items-center gap-2.5 rounded-[7px] px-2.5 hover:bg-accent hover:text-white"
      >
        <span className="flex w-4 shrink-0 items-center justify-center text-black/50 group-hover/menu-item:text-white">
          <Play />
        </span>
        <span className="flex-1">Run Command</span>
        <span className="text-black/[0.34] group-hover/menu-item:text-white">
          <ChevronRight />
        </span>

        {subOpen && (
          <div className="glass-surface-strong absolute left-[calc(100%_-_3px)] top-[-6px] w-[208px] rounded-[11px] border-[0.5px] p-1.5 shadow-ctx">
            {COMMANDS.map((command) => (
              <div
                key={command.id}
                onClick={() => {
                  onRunCommand(command, worktree, project)
                  onClose()
                }}
                className="group/sub flex h-9 items-center gap-2.5 rounded-[7px] px-2.5 hover:bg-accent hover:text-white"
              >
                <span className="flex w-4 shrink-0 items-center justify-center">
                  <span
                    className="h-2 w-2 rounded-full shadow-[inset_0_0_0_0.5px_rgba(0,0,0,0.12)]"
                    style={{ background: command.color }}
                  />
                </span>
                <span className="flex flex-1 flex-col">
                  {command.name}
                  <em className="not-italic text-[10px] text-black/[0.34] group-hover/sub:text-white/80">
                    {command.desc}
                  </em>
                </span>
              </div>
            ))}
            <MenuSeparator />
            <div
              onClick={() => {
                onClose()
                onEditCommands(project)
              }}
              className="group/sub flex h-9 items-center gap-2.5 rounded-[7px] px-2.5 hover:bg-accent hover:text-white"
            >
              <span className="flex w-4 shrink-0 items-center justify-center text-black/50 group-hover/sub:text-white">
                <Gear />
              </span>
              <span className="flex-1">Edit Commands…</span>
            </div>
          </div>
        )}
      </div>

      <MenuItem
        icon={<Copy />}
        label="Copy Worktree Path"
        onHover={() => setSubOpen(false)}
        onClick={() => {
          try {
            navigator.clipboard?.writeText(worktree.path)
          } catch {
            /* noop */
          }
          onClose()
        }}
      />

      <MenuSeparator />

      {worktree.current ? (
        <MenuItem icon={<Archive />} label="Archive Worktree…" disabled />
      ) : (
        <MenuItem
          icon={<Archive />}
          label="Archive Worktree…"
          danger
          onHover={() => setSubOpen(false)}
          onClick={() => {
            onArchive(worktree, project)
            onClose()
          }}
        />
      )}
    </div>
  )
}
