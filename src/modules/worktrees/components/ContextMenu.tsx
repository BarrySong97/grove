/**
 * @purpose Renders the worktree context menu with flattened command and native-open actions.
 * @role    Floating menu for backend open/archive actions plus run-command placeholder.
 * @deps    React effect/ref, Worktrees contracts/domain commands, shared icons/ui
 * @gotcha  Menu position is clamped to viewport; run command is not a managed backend process yet.
 */
import { useEffect, useRef, type ReactNode } from 'react'
import type { CommandDef, Project, Worktree } from '../../../shared/contracts/worktrees'
import { Archive, Copy, Editor, Finder, Gear, Terminal } from '../../../shared/icons'
import { MenuItem, MenuSeparator } from '../../../shared/ui/MenuItem'
import { COMMANDS } from '../domain/commands'

export type OpenWorkspaceTarget = 'finder' | 'zed' | 'cursor' | 'vs_code' | 'ghostty' | 'terminal'

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
  onOpenWorkspace: (worktree: Worktree, project: Project, target: OpenWorkspaceTarget) => void
  onEditCommands: (project: Project) => void
}

export function ContextMenu({
  ctx,
  onClose,
  onRunCommand,
  onArchive,
  onOpenWorkspace,
  onEditCommands
}: ContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null)
  const { worktree, project } = ctx

  useEffect(() => {
    const onDown = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) onClose()
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [onClose])

  const left = Math.min(ctx.x, window.innerWidth - 244)
  const top = Math.min(ctx.y, window.innerHeight - 388)

  return (
    <div
      ref={ref}
      style={{ left, top }}
      className="menu-surface fixed z-50 w-[230px] animate-panel-in rounded-[11px] border-[0.5px] p-1.5 font-sans text-[13px] text-[#1c1c1e] shadow-ctx"
    >
      <MenuSectionTitle>{worktree.branch}</MenuSectionTitle>

      <MenuSectionTitle>Open</MenuSectionTitle>
      <MenuItem
        icon={<Finder />}
        label="Reveal in Finder"
        onClick={() => onOpenWorkspace(worktree, project, 'finder')}
      />
      <MenuItem
        icon={<Editor />}
        label="Open in Zed"
        onClick={() => onOpenWorkspace(worktree, project, 'zed')}
      />
      <MenuItem
        icon={<Editor />}
        label="Open in Cursor"
        onClick={() => onOpenWorkspace(worktree, project, 'cursor')}
      />
      <MenuItem
        icon={<Editor />}
        label="Open in VS Code"
        onClick={() => onOpenWorkspace(worktree, project, 'vs_code')}
      />
      <MenuItem
        icon={<Terminal />}
        label="Open in Ghostty"
        onClick={() => onOpenWorkspace(worktree, project, 'ghostty')}
      />
      <MenuItem
        icon={<Terminal />}
        label="Open in Terminal"
        onClick={() => onOpenWorkspace(worktree, project, 'terminal')}
      />

      <MenuSeparator />

      <MenuSectionTitle>Run Command</MenuSectionTitle>
      {COMMANDS.map((command) => (
        <CommandMenuItem
          key={command.id}
          command={command}
          onClick={() => {
            onRunCommand(command, worktree, project)
            onClose()
          }}
        />
      ))}
      <MenuItem
        icon={<Gear />}
        label="Edit Commands…"
        onClick={() => {
          onClose()
          onEditCommands(project)
        }}
      />

      <MenuSeparator />

      <MenuItem
        icon={<Copy />}
        label="Copy Worktree Path"
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
          onClick={() => {
            onArchive(worktree, project)
            onClose()
          }}
        />
      )}
    </div>
  )
}

function MenuSectionTitle({ children }: { children: ReactNode }) {
  return (
    <div className="truncate px-2.5 pb-1.5 pt-1.5 font-mono text-[10.5px] font-semibold text-black/[0.34]">
      {children}
    </div>
  )
}

function CommandMenuItem({ command, onClick }: { command: CommandDef; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="group/menu-item flex h-9 items-center gap-2.5 rounded-[7px] px-2.5 hover:bg-accent hover:text-white"
    >
      <span className="flex w-4 shrink-0 items-center justify-center">
        <span
          className="h-2 w-2 rounded-full shadow-[inset_0_0_0_0.5px_rgba(0,0,0,0.12)]"
          style={{ background: command.color }}
        />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span>{command.name}</span>
        <em className="truncate text-[10px] not-italic text-black/[0.34] group-hover/menu-item:text-white/80">
          {command.desc}
        </em>
      </span>
    </div>
  )
}
