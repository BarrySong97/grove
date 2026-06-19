/**
 * @purpose Renders the remove-project confirm sheet with behavior summary.
 * @role    Confirm sheet content shown by WorktreePanel before removing a project.
 * @deps    react-i18next, Worktrees contracts, settings kit (SettingsHeader/Button/Footer)
 * @gotcha  Project removal never deletes the main repository directory.
 */
import { useTranslation } from 'react-i18next'
import type { Project } from '../../../../shared/contracts/worktrees'
import { SettingsButton } from './SettingsButton'
import { SettingsFooter } from './SettingsFooter'
import { SettingsHeader } from './SettingsHeader'

interface RemoveProjectChoiceProps {
  behavior: 'grove_only' | 'delete_worktrees'
  project: Project
  onCancel: () => void
  onConfirm: () => void
}

export function RemoveProjectChoice({
  behavior,
  project,
  onCancel,
  onConfirm
}: RemoveProjectChoiceProps) {
  const { t } = useTranslation()

  return (
    <div className="space-y-3 p-1">
      <SettingsHeader
        className="px-1"
        title={t('sheets.removeProject.title')}
        subtitle={project.name}
      />
      <div className="rounded-lg bg-black/[0.035] px-3 py-2 text-[12px] leading-5 text-black/55">
        {t('sheets.removeProject.base')}
        {behavior === 'delete_worktrees'
          ? t('sheets.removeProject.deleteWorktrees')
          : t('sheets.removeProject.groveOnly')}
      </div>
      <SettingsFooter className="">
        <SettingsButton onPress={onCancel}>{t('common.close')}</SettingsButton>
        <SettingsButton tone="danger" onPress={onConfirm}>
          {t('sheets.removeProject.confirm')}
        </SettingsButton>
      </SettingsFooter>
    </div>
  )
}
