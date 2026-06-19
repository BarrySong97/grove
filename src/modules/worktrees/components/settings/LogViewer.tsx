/**
 * @purpose Renders the worktree operation log viewer sheet.
 * @role    Confirm/inspect sheet content shown by WorktreePanel for failed-op logs.
 * @deps    react-i18next, settings kit (SettingsHeader/Button/Footer)
 * @gotcha  Empty content falls back to a localized placeholder string.
 */
import { useTranslation } from 'react-i18next'
import { SettingsButton } from './SettingsButton'
import { SettingsFooter } from './SettingsFooter'
import { SettingsHeader } from './SettingsHeader'

interface LogViewerProps {
  title: string
  content: string
  onClose: () => void
}

export function LogViewer({ title, content, onClose }: LogViewerProps) {
  const { t } = useTranslation()

  return (
    <div className="space-y-3 p-1">
      <SettingsHeader className="px-1" title={t('sheets.log.title')} subtitle={title} />
      <pre className="max-h-[360px] overflow-auto rounded-lg bg-black/[0.04] p-2 font-mono text-[10.5px] leading-4 text-black/70">
        {content || t('sheets.log.empty')}
      </pre>
      <SettingsFooter className="">
        <SettingsButton onPress={onClose}>{t('common.close')}</SettingsButton>
      </SettingsFooter>
    </div>
  )
}
