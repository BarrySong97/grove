/**
 * @purpose Renders Grove panel header with brand, add-project, and the project overview entry.
 * @role    Header slot for PanelShell used by WorktreePanel.
 * @deps    Hero UI Button, react-i18next, shared icons/ui, shared Grove SVG asset
 * @gotcha  Settings gear lives in the footer, not here; project search is type-ahead (no button); add-project delegates native work to the state hook.
 */
import { Button } from '@heroui/react/button'
import { useTranslation } from 'react-i18next'
import groveIconUrl from '../../../shared/assets/Grove.svg'
import { Grid, Import } from '../../../shared/icons'
import { Divider } from '../../../shared/ui/Divider'
import { IconButton } from '../../../shared/ui/IconButton'

interface PanelHeaderProps {
  projectCount: number
  onAddProject: () => void
  onOpenOverview: () => void
}

export function PanelHeader({ projectCount, onAddProject, onOpenOverview }: PanelHeaderProps) {
  const { t } = useTranslation()

  return (
    <>
      <div className="flex items-center gap-2.5 px-2.5 pb-2 pt-1.5">
        <img src={groveIconUrl} alt="" className="h-[22px] w-[22px] shrink-0 rounded-md" />
        <span className="flex-1 text-[14px] font-semibold tracking-[-0.2px]">Grove</span>
        {projectCount >= 2 && (
          <IconButton title={t('overview.open')} size="project" onClick={onOpenOverview}>
            <Grid />
          </IconButton>
        )}
      </div>
      <div className="px-1 pb-1">
        <Button
          onPress={onAddProject}
          fullWidth
          size="sm"
          variant="ghost"
          className="grove-icon-scale h-auto justify-start gap-[7px] rounded-lg px-2.5 py-[7px] text-[12.5px] text-black/50 transition-colors hover:bg-black/[0.038] hover:text-black/90"
        >
          <Import /> {t('header.addProject')}
        </Button>
      </div>
      <Divider />
    </>
  )
}
