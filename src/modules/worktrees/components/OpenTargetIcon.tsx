/**
 * @purpose Renders downloaded app icons for workspace open targets.
 * @role    Small visual adapter shared by worktree rows, action sheets, and settings affordances.
 * @deps    generated OpenWorkspaceTargetDto, shared open-target image assets
 * @gotcha  Icon files are local app-identification assets; docs/modules/worktrees/README.md
 */
import type { OpenWorkspaceTargetDto } from '../../../shared/bindings/commands'
import cursorIcon from '../../../shared/assets/open-targets/cursor.png'
import finderIcon from '../../../shared/assets/open-targets/finder.png'
import ghosttyIcon from '../../../shared/assets/open-targets/ghostty.png'
import terminalIcon from '../../../shared/assets/open-targets/terminal.png'
import vsCodeIcon from '../../../shared/assets/open-targets/vscode.png'
import zedIcon from '../../../shared/assets/open-targets/zed.svg'

interface OpenTargetIconProps {
  target: OpenWorkspaceTargetDto
  className?: string
}

const iconByTarget: Record<OpenWorkspaceTargetDto, string> = {
  finder: finderIcon,
  zed: zedIcon,
  cursor: cursorIcon,
  vs_code: vsCodeIcon,
  ghostty: ghosttyIcon,
  terminal: terminalIcon
}

export function OpenTargetIcon({ target, className = '' }: OpenTargetIconProps) {
  return (
    <img
      src={iconByTarget[target]}
      alt=""
      aria-hidden="true"
      draggable={false}
      className={`h-[15px] w-[15px] shrink-0 object-contain ${className}`}
    />
  )
}
