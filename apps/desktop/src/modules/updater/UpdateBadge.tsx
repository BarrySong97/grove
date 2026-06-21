/**
 * @purpose Renders the bottom-right floating update pill inside the panel.
 * @role    Updater feature UI; shows an actionable icon when a new Grove release is available.
 * @deps    react-i18next, shared icons, ./useUpdater
 * @gotcha  Hidden entirely while idle; click installs and relaunches; docs/modules/updater/README.md
 */
import { useTranslation } from 'react-i18next'
import { Spinner, UpdateDownload } from '../../shared/icons'
import { useUpdater } from './useUpdater'

export function UpdateBadge() {
  const { status, version, progress, installAndRestart } = useUpdater()
  const { t } = useTranslation()

  if (status === 'idle') return null

  const isBusy = status === 'downloading' || status === 'installing'
  const isClickable = status === 'available' || status === 'error'

  const label =
    status === 'downloading'
      ? t('updater.downloading', { progress })
      : status === 'installing'
        ? t('updater.installing')
        : status === 'error'
          ? t('updater.error')
          : t('updater.available')

  const tooltip =
    status === 'error'
      ? t('updater.errorTooltip')
      : status === 'available'
        ? t('updater.availableTooltip', { version: version ?? '' })
        : label

  return (
    <button
      type="button"
      title={tooltip}
      aria-label={tooltip}
      disabled={isBusy}
      onClick={isClickable ? installAndRestart : undefined}
      className={`absolute bottom-[52px] right-3.5 z-50 flex animate-panel-in items-center gap-1.5 rounded-full border-[0.5px] border-white/10 bg-[rgba(28,28,32,0.92)] px-3 py-1.5 text-[11.5px] font-semibold text-white shadow-[0_10px_28px_rgba(0,0,0,0.32)] backdrop-blur-xl transition-colors ${
        isClickable
          ? 'grove-icon-scale cursor-pointer hover:bg-[rgba(40,40,46,0.95)]'
          : 'cursor-default'
      }`}
    >
      {isBusy ? <Spinner className="animate-spin" /> : <UpdateDownload />}
      <span className="leading-none">{label}</span>
    </button>
  )
}
