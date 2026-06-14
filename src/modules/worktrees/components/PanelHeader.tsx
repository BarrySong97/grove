/**
 * @purpose Renders Grove panel header with counts and add-project affordance.
 * @role    Header slot for PanelShell used by WorktreePanel.
 * @deps    shared icons/ui
 * @gotcha  Add project currently only flashes a toast; docs/modules/worktrees/README.md
 */
import { GroveIcon, Import } from '../../../shared/icons'
import { Divider } from '../../../shared/ui/Divider'

interface PanelHeaderProps {
  total: number
  projectCount: number
  onAddProject: () => void
}

export function PanelHeader({ total, projectCount, onAddProject }: PanelHeaderProps) {
  return (
    <>
      <div className="flex items-center gap-2.5 px-2.5 pb-2 pt-1.5">
        <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-md bg-accent text-white">
          <GroveIcon />
        </span>
        <span className="flex-1 text-[14px] font-semibold tracking-[-0.2px]">Grove</span>
        <span className="text-[11.5px] tabular-nums text-black/[0.34]">
          {total} worktrees · {projectCount} projects
        </span>
      </div>
      <div className="px-1 pb-1">
        <button
          onClick={onAddProject}
          className="flex w-full items-center gap-[7px] rounded-lg px-2.5 py-[7px] text-[12.5px] text-black/50 transition-colors hover:bg-black/[0.038] hover:text-black/90"
        >
          <Import /> Add project…
        </button>
      </div>
      <Divider />
    </>
  )
}
