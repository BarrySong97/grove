/**
 * @purpose Renders the panel footer and quit action.
 * @role    Footer slot for PanelShell; delegates quit to the app shell.
 * @deps    Hero UI Button, shared icons/ui
 * @gotcha  Quit action is provided by Tauri command callback; docs/modules/app/README.md
 */
import { Button } from '@heroui/react/button'
import { Quit } from '../../../shared/icons'
import { Divider } from '../../../shared/ui/Divider'

interface PanelFooterProps {
  onQuit?: () => void
}

export function PanelFooter({ onQuit }: PanelFooterProps) {
  const quitTitleProps = { title: 'Quit' }

  return (
    <>
      <Divider />
      <div className="flex items-center gap-0.5 px-1 pb-0.5 pt-0.5">
        <span className="flex-1" />
        <Button
          {...quitTitleProps}
          aria-label="Quit"
          onClick={onQuit}
          size="sm"
          variant="ghost"
          className="grove-icon-scale h-auto gap-[7px] rounded-lg px-2.5 py-[7px] text-black/50 transition-colors hover:bg-black/[0.038] hover:text-black/90"
        >
          <Quit />
        </Button>
      </div>
    </>
  )
}
