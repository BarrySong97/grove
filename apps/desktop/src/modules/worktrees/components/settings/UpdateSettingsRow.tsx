/**
 * @purpose Settings row that manually checks for Grove updates and installs one if found.
 * @role    Surfaces the in-app updater inside Global Settings so users can update without relaunching.
 * @deps    react-i18next, updater module's useUpdater, SettingsRow/SettingsButton
 * @gotcha  Uses its own useUpdater instance; checkNow works outside PROD's auto-check; docs/modules/updater/README.md
 */
import { useTranslation } from 'react-i18next'
import { useUpdater } from '../../../updater'
import { SettingsButton } from './SettingsButton'
import { SettingsRow } from './SettingsRow'

export function UpdateSettingsRow() {
  const { t } = useTranslation()
  const { status, version, progress, checking, checkedAt, checkNow, installAndRestart } =
    useUpdater()

  const available = status === 'available'
  const busy = status === 'downloading' || status === 'installing'

  const help = busy
    ? status === 'downloading'
      ? t('settings.updates.downloading', { progress })
      : t('settings.updates.installing')
    : available
      ? t('settings.updates.available', { version: version ?? '' })
      : checking
        ? t('settings.updates.checking')
        : checkedAt !== null
          ? t('settings.updates.upToDate')
          : undefined

  return (
    <SettingsRow label={t('settings.updates.label')} help={help}>
      {available || busy ? (
        <SettingsButton tone="primary" isDisabled={busy} onPress={installAndRestart}>
          {t('settings.updates.install')}
        </SettingsButton>
      ) : (
        <SettingsButton isDisabled={checking} onPress={checkNow}>
          {checking ? t('settings.updates.checking') : t('settings.updates.check')}
        </SettingsButton>
      )}
    </SettingsRow>
  )
}
