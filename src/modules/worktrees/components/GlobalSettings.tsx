/**
 * @purpose Renders application-wide Grove settings controls.
 * @role    Global settings subview for backend-owned native behavior preferences.
 * @deps    Hero UI Button/Switch, generated settings DTOs, shared icons/ui
 * @gotcha  Settings are persisted through Rust commands; density comes from src/index.css tokens.
 */
import { Button } from '@heroui/react/button'
import { Switch } from '@heroui/react/switch'
import type { AppSettingsDto } from '../../../shared/bindings/commands'
import { ChevronLeft, Terminal } from '../../../shared/icons'
import { Divider } from '../../../shared/ui/Divider'

interface GlobalSettingsProps {
  settings: AppSettingsDto
  saving: boolean
  onGhosttyOpenModeChange: (openInTabs: boolean) => void
  onClose: () => void
}

export function GlobalSettings({
  settings,
  saving,
  onGhosttyOpenModeChange,
  onClose
}: GlobalSettingsProps) {
  const openInTabs = settings.ghosttyOpenMode === 'tab'

  return (
    <div className="p-0.5">
      <div className="flex items-center px-0.5 pb-1 pt-0.5">
        <Button
          type="button"
          onClick={onClose}
          size="sm"
          variant="secondary"
          className="grove-icon-scale grove-settings-back-button"
        >
          <ChevronLeft className="text-black/[0.34]" /> Projects
        </Button>
      </div>

      <div className="px-2.5 pb-2.5 pt-0.5">
        <span className="grove-settings-title block">Settings</span>
        <span className="grove-settings-subtitle">Application preferences</span>
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
                  <Terminal />
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
    </div>
  )
}
