/**
 * @purpose Renders the archive-worktree confirm sheet (hide vs remove worktree).
 * @role    Confirm sheet content shown by WorktreePanel when archive policy is "ask".
 * @deps    react-i18next, settings kit (SettingsHeader/Button/Footer)
 * @gotcha  Destructive remove uses danger tone; cancel keeps the worktree untouched.
 */
import { useTranslation } from 'react-i18next'
import { SettingsButton } from './SettingsButton'
import { SettingsFooter } from './SettingsFooter'
import { SettingsHeader } from './SettingsHeader'

interface ArchiveChoiceProps {
  projectName: string
  worktreeBranch: string
  onHide: () => void
  onRemove: () => void
  onCancel: () => void
}

export function ArchiveChoice({
  projectName,
  worktreeBranch,
  onHide,
  onRemove,
  onCancel
}: ArchiveChoiceProps) {
  const { t } = useTranslation()

  return (
    <div className="space-y-3 p-1">
      <SettingsHeader
        className="px-1"
        title={t('sheets.archive.title')}
        subtitle={`${projectName}/${worktreeBranch}`}
      />
      <div className="flex flex-col gap-1">
        <SettingsButton variant="block" onPress={onHide}>
          {t('sheets.archive.hide')}
        </SettingsButton>
        <SettingsButton variant="block" tone="danger" onPress={onRemove}>
          {t('sheets.archive.remove')}
        </SettingsButton>
      </div>
      <SettingsFooter className="">
        <SettingsButton onPress={onCancel}>{t('common.close')}</SettingsButton>
      </SettingsFooter>
    </div>
  )
}
