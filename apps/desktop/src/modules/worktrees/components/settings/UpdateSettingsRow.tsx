/**
 * @purpose Settings row that manually checks for Grove updates and installs one if found.
 * @role    Surfaces the in-app updater inside Global Settings so users can update without relaunching.
 * @deps    react-i18next, @tauri-apps/api/app getVersion, updater module's useUpdater, SettingsRow/SettingsButton
 * @gotcha  Own useUpdater instance with auto:false — checks ONLY on button click, never on settings open; docs/modules/updater/README.md
 */
import { getVersion } from '@tauri-apps/api/app'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useUpdater } from '../../../updater'
import { SettingsButton } from './SettingsButton'
import { SettingsRow } from './SettingsRow'

export function UpdateSettingsRow() {
  const { t } = useTranslation()
  // auto: false — only check when the user clicks the button, never on settings open.
  const { status, version, progress, checking, checkedAt, checkNow, installAndRestart } =
    useUpdater({ auto: false })
  const [appVersion, setAppVersion] = useState('')
  useEffect(() => {
    // getVersion() throws outside a Tauri webview (e.g. vitest/jsdom) — guard it.
    try {
      getVersion()
        .then(setAppVersion)
        .catch(() => {})
    } catch {}
  }, [])

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
    <>
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
      {appVersion && (
        <SettingsRow label={t('settings.updates.version')}>
          <span className="text-[length:var(--settings-label-size)] tabular-nums text-black/45">
            {appVersion}
          </span>
        </SettingsRow>
      )}
    </>
  )
}
