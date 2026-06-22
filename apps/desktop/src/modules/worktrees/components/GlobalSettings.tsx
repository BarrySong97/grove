/**
 * @purpose Renders application-wide Grove settings controls.
 * @role    Bottom sheet content for persisted language, open, archive, and remove preferences.
 * @deps    react-i18next, generated settings DTOs, shared i18n/icons, local settings kit
 * @gotcha  Settings are persisted through Rust commands; density comes from src/index.css tokens.
 */
import { useTranslation } from 'react-i18next'
import type {
  AppLanguageDto,
  AppSettingsDto,
  ArchivePolicyDto,
  NewProjectPositionDto,
  OpenWorkspaceTargetDto,
  RemoveProjectBehaviorDto
} from '../../../shared/bindings/commands'
import { LANGUAGE_OPTIONS } from '../../../shared/i18n/language'
import { OPEN_TARGET_OPTIONS } from '../domain/open-targets'
import { OpenTargetIcon } from './OpenTargetIcon'
import { SettingsButton } from './settings/SettingsButton'
import { SettingsFooter } from './settings/SettingsFooter'
import { SettingsHeader } from './settings/SettingsHeader'
import { SettingsRow } from './settings/SettingsRow'
import { SettingsSection } from './settings/SettingsSection'
import { SettingsSelect } from './settings/SettingsSelect'
import { SettingsSheet } from './settings/SettingsSheet'
import { UpdateSettingsRow } from './settings/UpdateSettingsRow'

interface GlobalSettingsProps {
  settings: AppSettingsDto
  saving: boolean
  onHoverQuickOpenTargetsChange: (targets: OpenWorkspaceTargetDto[]) => void
  onDefaultArchivePolicyChange: (policy: ArchivePolicyDto) => void
  onLanguageChange: (language: AppLanguageDto) => void
  onNewProjectPositionChange: (position: NewProjectPositionDto) => void
  onRemoveProjectBehaviorChange: (behavior: RemoveProjectBehaviorDto) => void
  onClose: () => void
}

function toggleQuickOpenTarget(
  targets: OpenWorkspaceTargetDto[],
  target: OpenWorkspaceTargetDto
): OpenWorkspaceTargetDto[] {
  return targets.includes(target)
    ? targets.filter((value) => value !== target)
    : [...targets, target]
}

export function GlobalSettings({
  settings,
  saving,
  onHoverQuickOpenTargetsChange,
  onDefaultArchivePolicyChange,
  onLanguageChange,
  onNewProjectPositionChange,
  onRemoveProjectBehaviorChange,
  onClose
}: GlobalSettingsProps) {
  const { t } = useTranslation()

  return (
    <SettingsSheet>
      <SettingsHeader title={t('settings.title')} subtitle={t('settings.subtitle')} />

      <SettingsSection title={t('settings.sections.general')}>
        <SettingsRow label={t('settings.language.label')}>
          <SettingsSelect
            ariaLabel={t('settings.language.ariaLabel')}
            disabled={saving}
            value={settings.language}
            onChange={onLanguageChange}
            options={LANGUAGE_OPTIONS.map((option) => ({
              value: option.id,
              label: t(option.labelKey)
            }))}
          />
        </SettingsRow>

        <SettingsRow label={t('settings.newProjectPosition.label')}>
          <SettingsSelect
            ariaLabel={t('settings.newProjectPosition.ariaLabel')}
            disabled={saving}
            value={settings.newProjectPosition}
            onChange={onNewProjectPositionChange}
            options={[
              { value: 'first', label: t('settings.newProjectPosition.first') },
              { value: 'last', label: t('settings.newProjectPosition.last') }
            ]}
          />
        </SettingsRow>
      </SettingsSection>

      <SettingsSection title={t('settings.sections.open')}>
        <SettingsRow
          align="start"
          label={t('settings.hoverQuickOpen.label')}
          help={t('settings.hoverQuickOpen.help')}
        >
          <div className="flex min-w-0 flex-1 flex-wrap gap-1.5">
            {OPEN_TARGET_OPTIONS.map((option) => {
              const selected = settings.hoverQuickOpenTargets.includes(option.id)
              return (
                <button
                  key={option.id}
                  type="button"
                  aria-label={option.label}
                  aria-pressed={selected}
                  disabled={saving}
                  onClick={() =>
                    onHoverQuickOpenTargetsChange(
                      toggleQuickOpenTarget(settings.hoverQuickOpenTargets, option.id)
                    )
                  }
                  className={`grove-icon-scale flex items-center gap-1.5 rounded-[var(--settings-control-radius)] px-2 py-[5px] text-[length:var(--settings-label-size)] font-medium transition-colors ${
                    selected
                      ? 'bg-[var(--accent-soft)] text-[#1c1c1e] shadow-[inset_0_0_0_1px_var(--accent)]'
                      : 'bg-black/[0.04] text-black/55 hover:bg-black/[0.06]'
                  } ${saving ? 'opacity-55' : ''}`}
                >
                  <OpenTargetIcon target={option.id} />
                  {option.label}
                </button>
              )
            })}
          </div>
        </SettingsRow>
      </SettingsSection>

      <SettingsSection title={t('settings.sections.workflows')}>
        <SettingsRow label={t('settings.archive.label')}>
          <SettingsSelect
            ariaLabel={t('settings.archive.ariaLabel')}
            disabled={saving}
            value={settings.defaultArchivePolicy}
            onChange={onDefaultArchivePolicyChange}
            options={[
              { value: 'ask', label: t('settings.archive.ask') },
              { value: 'hide', label: t('settings.archive.hide') },
              { value: 'remove_worktree', label: t('settings.archive.removeWorktree') }
            ]}
          />
        </SettingsRow>

        <SettingsRow
          label={t('settings.removeProject.label')}
          help={t('settings.removeProject.help')}
        >
          <SettingsSelect
            ariaLabel={t('settings.removeProject.ariaLabel')}
            disabled={saving}
            value={settings.removeProjectBehavior}
            onChange={onRemoveProjectBehaviorChange}
            options={[
              { value: 'grove_only', label: t('settings.removeProject.groveOnly') },
              { value: 'delete_worktrees', label: t('settings.removeProject.deleteWorktrees') }
            ]}
          />
        </SettingsRow>
      </SettingsSection>

      <SettingsSection title={t('settings.sections.updates')}>
        <UpdateSettingsRow />
      </SettingsSection>

      <SettingsFooter>
        <SettingsButton onPress={onClose}>{t('common.close')}</SettingsButton>
      </SettingsFooter>
    </SettingsSheet>
  )
}
