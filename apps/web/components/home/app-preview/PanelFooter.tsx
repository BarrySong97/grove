/* Faithful footer port — language shortcut + quit. */
import { Quit, Divider } from '@grove/ui'

export function PanelFooter() {
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
