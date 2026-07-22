/* Faithful footer port — language shortcut + settings (opens sheet) + quit. */
import { Gear, Quit, Divider } from '@grove/ui'

export function PanelFooter({ onOpenSettings }: { onOpenSettings?: () => void }) {
  return (
    <>
      <Divider />
      <div className="flex items-center gap-0.5 px-1 pb-0.5 pt-0.5">
        <span className="flex h-[28px] max-w-[78px] items-center rounded-lg px-2 text-[11.5px] font-semibold text-black/50">
          EN
        </span>
        <span className="flex-1" />
        <button
          type="button"
          aria-label="Settings"
          title="Settings"
          onClick={onOpenSettings}
          className="grove-icon-scale flex h-auto cursor-pointer items-center gap-[7px] rounded-lg px-2.5 py-[7px] text-black/50 transition-colors hover:bg-black/[0.038] hover:text-black/90"
        >
          <Gear />
        </button>
        <button
          type="button"
          aria-label="Quit"
          title="Quit"
          className="grove-icon-scale flex h-auto cursor-pointer items-center gap-[7px] rounded-lg px-2.5 py-[7px] text-black/50 transition-colors hover:bg-black/[0.038] hover:text-black/90"
        >
          <Quit />
        </button>
      </div>
    </>
  )
}
