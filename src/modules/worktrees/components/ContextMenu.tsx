/**
 * @purpose Renders the worktree action sheet with native-open, recovery, and archive actions.
 * @role    Bottom sheet for backend open/archive/retry/log actions.
 * @deps    Worktrees contracts, shared icons/ui
 * @gotcha  Run Command is intentionally absent; setup/archive execute only through backend workflows.
 */
import type { ReactNode } from 'react'
import type { Project, Worktree } from '../../../shared/contracts/worktrees'
import { Archive, Copy, Gear, Log, Retry } from '../../../shared/icons'
import { BottomSheet } from '../../../shared/ui/BottomSheet'
import { MenuItem, MenuSeparator } from '../../../shared/ui/MenuItem'
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
  onArchive: (worktree: Worktree, project: Project) => void
  onRetry: (worktree: Worktree, project: Project) => void
  onViewLog: (worktree: Worktree, project: Project) => void
  onOpenWorkspace: (worktree: Worktree, project: Project, target: OpenWorkspaceTarget) => void
  onEditCommands: (project: Project) => void
}

export function ContextMenu({
  ctx,
  onClose,
  onArchive,
  onRetry,
  onViewLog,
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

      {worktree.status === 'failed' && (
        <>
          <MenuSectionTitle>Recovery</MenuSectionTitle>
          <MenuItem
            icon={<Log />}
            label="View Log"
            onClick={() => {
              onViewLog(worktree, project)
              onClose()
            }}
          />
          <MenuItem
            icon={<Retry />}
            label="Retry"
            onClick={() => {
              onRetry(worktree, project)
              onClose()
            }}
          />
          <MenuSeparator />
        </>
      )}

      <MenuSectionTitle>Commands</MenuSectionTitle>
      <MenuItem
        icon={<Gear />}
        label="Edit Setup/Archive…"
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
