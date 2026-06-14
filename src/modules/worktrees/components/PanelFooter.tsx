import { Quit } from '../../../shared/icons'
import { Divider } from '../../../shared/ui/Divider'

interface PanelFooterProps {
  onQuit?: () => void
}

export function PanelFooter({ onQuit }: PanelFooterProps) {
  return (
    <>
      <Divider />
      <div className="flex items-center gap-0.5 px-1 pb-0.5 pt-0.5">
        <span className="flex-1" />
        <button
          title="Quit"
          onClick={onQuit}
          className="flex items-center gap-[7px] rounded-lg px-2.5 py-[7px] text-black/50 transition-colors hover:bg-black/[0.038] hover:text-black/90"
        >
          <Quit />
        </button>
      </div>
    </>
  )
}
