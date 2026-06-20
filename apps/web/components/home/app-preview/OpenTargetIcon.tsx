/* eslint-disable @next/next/no-img-element -- tiny fixed-size local app icons; next/image is overkill */
import type { OpenWorkspaceTarget } from '@grove/ui'

const fileByTarget: Record<OpenWorkspaceTarget, string> = {
  finder: '/open-targets/finder.png',
  zed: '/open-targets/zed.svg',
  cursor: '/open-targets/cursor.png',
  vs_code: '/open-targets/vscode.png',
  ghostty: '/open-targets/ghostty.png',
  terminal: '/open-targets/terminal.png',
}

export function OpenTargetIcon({
  target,
  className = '',
}: {
  target: OpenWorkspaceTarget
  className?: string
}) {
  return (
    <img
      src={fileByTarget[target]}
      alt=""
      aria-hidden="true"
      draggable={false}
      className={`h-[15px] w-[15px] shrink-0 object-contain ${className}`}
    />
  )
}
