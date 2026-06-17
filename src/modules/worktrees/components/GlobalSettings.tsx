/**
 * @purpose Renders application-wide Grove settings controls.
 * @role    Bottom sheet content for backend-owned native behavior preferences.
 * @deps    Hero UI Button/Switch, generated settings DTOs, shared icons/ui
 * @gotcha  Settings are persisted through Rust commands; density comes from src/index.css tokens.
 */
import { Button } from '@heroui/react/button'
import { Switch } from '@heroui/react/switch'
import type { AppSettingsDto, OpenWorkspaceTargetDto } from '../../../shared/bindings/commands'
import { Divider } from '../../../shared/ui/Divider'
import { OPEN_TARGET_OPTIONS } from '../domain/open-targets'
import { OpenTargetIcon } from './OpenTargetIcon'

interface GlobalSettingsProps {
  settings: AppSettingsDto
  saving: boolean
  onDefaultOpenTargetChange: (target: OpenWorkspaceTargetDto) => void
  onGhosttyOpenModeChange: (openInTabs: boolean) => void
  onClose: () => void
}

export function GlobalSettings({
  settings,
  saving,
  onDefaultOpenTargetChange,
  onGhosttyOpenModeChange,
  onClose
}: GlobalSettingsProps) {
  const openInTabs = settings.ghosttyOpenMode === 'tab'

  return (
    <div className="p-0.5">
      <div className="px-2.5 pb-2.5 pt-2">
        <span className="grove-settings-title block">Settings</span>
        <span className="grove-settings-subtitle">Application preferences</span>
      </div>

      <Divider />

      <div className="grove-settings-section-title">Open</div>

      <div className="grove-settings-row">
        <div className="grove-settings-row-inner">
          <span className="grove-settings-label">默认打开</span>
          <select
            aria-label="Default open target"
            className="grove-field-thin-focus grove-settings-field min-w-0 flex-1 appearance-auto border-0 font-medium"
            disabled={saving}
            value={settings.defaultOpenTarget}
            onChange={(event) =>
              onDefaultOpenTargetChange(event.target.value as OpenWorkspaceTargetDto)
            }
          >
            {OPEN_TARGET_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <Divider />

      <div className="grove-settings-section-title">Ghostty</div>

      <div className="grove-settings-row">
        <Switch
          aria-label="Open Ghostty workspaces in tabs"
          className="group flex w-full items-center justify-between gap-3 rounded-lg px-0 py-1"
          isDisabled={saving}
          isSelected={openInTabs}
          onChange={onGhosttyOpenModeChange}
          size="sm"
        >
          {({ isSelected }) => (
            <>
              <span className="flex min-w-0 items-center gap-2.5">
                <span className="grove-icon-scale flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-md bg-black/[0.04] text-black/45 shadow-[inset_0_0_0_0.5px_rgba(0,0,0,0.08)]">
                  <OpenTargetIcon target="ghostty" />
                </span>
                <span className="min-w-0">
                  <span className="grove-settings-row-title block truncate">
                    Open workspaces in tabs
                  </span>
                  <span className="block truncate pt-[3px] text-[length:var(--settings-meta-size)] leading-[1.25] text-black/[0.34]">
                    Use the current Ghostty window when possible
                  </span>
                </span>
              </span>
              <Switch.Control
                className={`relative flex h-[18px] w-[32px] shrink-0 items-center rounded-full p-[2px] shadow-[inset_0_0_0_0.5px_rgba(0,0,0,0.12)] transition-colors ${
                  isSelected ? 'bg-accent' : 'bg-black/[0.14]'
                } ${saving ? 'opacity-55' : ''}`}
              >
                <Switch.Thumb
                  className={`block h-[14px] w-[14px] rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.22)] transition-transform ${
                    isSelected ? 'translate-x-[14px]' : 'translate-x-0'
                  }`}
                />
              </Switch.Control>
            </>
          )}
        </Switch>
      </div>

      <div className="flex justify-end px-1.5 pb-1 pt-2.5">
        <Button
          className="h-auto rounded-[var(--settings-control-radius)] px-[14px] py-[6px] text-[length:var(--settings-label-size)] font-semibold"
          onClick={onClose}
          size="sm"
          type="button"
          variant="secondary"
        >
          关闭
        </Button>
      </div>
    </div>
  )
}
