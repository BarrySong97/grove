/**
 * @purpose Renders the panel footer, language shortcut, and quit action.
 * @role    Footer slot for PanelShell; delegates settings updates and quit to parent state/app shell.
 * @deps    Hero UI Button/Tooltip, @tauri-apps/api/app getVersion, react-i18next, shared i18n/icons/ui
 * @gotcha  Quit action is provided by Tauri command callback; docs/modules/app/README.md
 */
import { getVersion } from '@tauri-apps/api/app'
import { Button } from '@heroui/react/button'
import { Tooltip } from '@heroui/react/tooltip'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { AppLanguageDto } from '../../../shared/bindings/commands'
import { LANGUAGE_OPTIONS } from '../../../shared/i18n/language'
import { Quit } from '../../../shared/icons'
import { Divider } from '../../../shared/ui/Divider'

interface PanelFooterProps {
  language: AppLanguageDto
  saving?: boolean
  onLanguageChange: (language: AppLanguageDto) => void
  onQuit?: () => void
}

export function PanelFooter({
  language,
  saving = false,
  onLanguageChange,
  onQuit
}: PanelFooterProps) {
  const { t } = useTranslation()
  const [appVersion, setAppVersion] = useState('')
  useEffect(() => {
    // getVersion() throws outside a Tauri webview (e.g. vitest/jsdom) — guard it.
    try {
      getVersion()
        .then(setAppVersion)
        .catch(() => {})
    } catch {}
  }, [])
  const quitLabel = t('footer.quit')
  const languageLabel = t('footer.language')
  const quitTitleProps = { title: quitLabel }

  return (
    <>
      <Divider />
      <div className="flex items-center gap-0.5 px-1 pb-0.5 pt-0.5">
        <select
          aria-label={languageLabel}
          className="grove-field-thin-focus h-[28px] max-w-[78px] appearance-auto rounded-lg border-0 bg-transparent px-2 text-[11.5px] font-semibold text-black/50 transition-colors hover:bg-black/[0.038] hover:text-black/90 disabled:opacity-55"
          disabled={saving}
          value={language}
          onChange={(event) => onLanguageChange(event.target.value as AppLanguageDto)}
        >
          {LANGUAGE_OPTIONS.map((option) => (
            <option key={option.id} value={option.id}>
              {t(option.shortLabelKey)}
            </option>
          ))}
        </select>
        {appVersion && (
          <span className="px-1 text-[11px] font-medium tabular-nums text-black/30">
            v{appVersion}
          </span>
        )}
        <span className="flex-1" />
        <Tooltip delay={450}>
          <Tooltip.Trigger>
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
          </Tooltip.Trigger>
          <Tooltip.Content
            offset={5}
            className="rounded-md border border-black/[0.06] bg-[#1c1c1e] px-2 py-1 text-[10.5px] font-medium leading-none text-white shadow-[0_8px_22px_rgba(0,0,0,0.24)]"
          >
            {quitLabel}
          </Tooltip.Content>
        </Tooltip>
      </div>
    </>
  )
}
