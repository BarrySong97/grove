/**
 * @purpose Renders the worktree action sheet with flattened command and native-open actions.
 * @role    Bottom sheet for backend open/archive actions plus run-command placeholder.
 * @deps    Worktrees contracts/domain commands, shared icons/ui
 * @gotcha  Sheet keeps the old menu item layout on an opaque bottom-sheet surface; run command is not a managed backend process yet.
 */
import type { ReactNode } from 'react'
import type { CommandDef, Project, Worktree } from '../../../shared/contracts/worktrees'
import { Archive, Copy, Gear } from '../../../shared/icons'
import { BottomSheet } from '../../../shared/ui/BottomSheet'
import { MenuItem, MenuSeparator } from '../../../shared/ui/MenuItem'
import { COMMANDS } from '../domain/commands'
import { OPEN_TARGET_OPTIONS, openTargetActionLabel } from '../domain/open-targets'
import type { OpenWorkspaceTargetDto } from '../../../shared/bindings/commands'
import { OpenTargetIcon } from './OpenTargetIcon'

export type OpenWorkspaceTarget = OpenWorkspaceTargetDto

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
  const { worktree, project } = ctx

  return (
    <BottomSheet
      ariaLabel={`${worktree.branch} actions`}
      className="bottom-sheet-surface rounded-[11px] border-[0.5px] p-1.5 font-sans text-[13px] text-[#1c1c1e] shadow-ctx"
      isOpen
      onClose={onClose}
    >
      <MenuSectionTitle>{worktree.branch}</MenuSectionTitle>

      <MenuSectionTitle>Open</MenuSectionTitle>
      {OPEN_TARGET_OPTIONS.map((option) => (
        <MenuItem
          key={option.id}
          icon={<OpenTargetIcon target={option.id} />}
          label={openTargetActionLabel(option.id)}
          onClick={() => onOpenWorkspace(worktree, project, option.id)}
        />
      ))}

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
    </BottomSheet>
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
      className="group/menu-item flex h-9 cursor-pointer items-center gap-2.5 rounded-[7px] px-2.5 hover:bg-accent hover:text-white"
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
