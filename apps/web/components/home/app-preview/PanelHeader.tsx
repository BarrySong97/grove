/* Faithful header port — logo + counts + settings (opens sheet) + Add Project. */
import { Gear, GroveIcon, Import, IconButton, Divider } from '@grove/ui'

export function PanelHeader({
  total,
  projectCount,
  onOpenSettings,
}: {
  total: number
  projectCount: number
  onOpenSettings: () => void
}) {
  return (
    <>
      <div className="flex items-center gap-2.5 px-2.5 pb-2 pt-1.5">
        <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-md bg-[var(--accent)] text-white">
          <GroveIcon />
        </span>
        <span className="flex-1 text-[14px] font-semibold tracking-[-0.2px]">Grove</span>
        <span className="text-[11.5px] tabular-nums text-black/[0.34]">
          {total} worktrees · {projectCount} projects
        </span>
        <IconButton title="Settings" size="project" onClick={onOpenSettings}>
          <Gear />
        </IconButton>
      </div>
      <div className="px-1 pb-1">
        <button
          type="button"
          className="grove-icon-scale flex h-auto w-full cursor-pointer items-center justify-start gap-[7px] rounded-lg px-2.5 py-[7px] text-[12.5px] text-black/50 transition-colors hover:bg-black/[0.038] hover:text-black/90"
        >
          <Import /> Add Project
        </button>
      </div>
      <Divider />
    </>
  )
}
