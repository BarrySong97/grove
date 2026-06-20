'use client'

import { useState } from 'react'
import type { OpenWorkspaceTarget } from '@grove/ui'
import { OpenTargetIcon } from '../OpenTargetIcon'
import { SettingsSheet } from './SettingsSheet'
import { SettingsHeader } from './SettingsHeader'
import { SettingsSection } from './SettingsSection'
import { SettingsRow } from './SettingsRow'
import { SettingsSelect } from './SettingsSelect'
import { SettingsSwitchRow } from './SettingsSwitchRow'
import { SettingsFooter } from './SettingsFooter'
import { SettingsButton } from './SettingsButton'

const OPEN_TARGET_OPTIONS: { id: OpenWorkspaceTarget; label: string }[] = [
  { id: 'finder', label: 'Finder' },
  { id: 'zed', label: 'Zed' },
  { id: 'cursor', label: 'Cursor' },
  { id: 'vs_code', label: 'VS Code' },
  { id: 'ghostty', label: 'Ghostty' },
  { id: 'terminal', label: 'Terminal' },
]

/** Static replica of the desktop GlobalSettings — local state only, no persistence. */
export function GlobalSettings({ onClose }: { onClose: () => void }) {
  const [language, setLanguage] = useState('en')
  const [newProjectPosition, setNewProjectPosition] = useState('last')
  const [quickOpen, setQuickOpen] = useState<OpenWorkspaceTarget[]>(['cursor', 'terminal'])
  const [archivePolicy, setArchivePolicy] = useState('ask')
  const [removeBehavior, setRemoveBehavior] = useState('grove_only')
  const [ghosttyTab, setGhosttyTab] = useState(true)

  const toggleTarget = (id: OpenWorkspaceTarget) =>
    setQuickOpen((cur) => (cur.includes(id) ? cur.filter((t) => t !== id) : [...cur, id]))

  return (
    <SettingsSheet>
      <SettingsHeader title="Settings" subtitle="Defaults for new worktrees and how Grove opens them." />

      <SettingsSection title="General">
        <SettingsRow label="Language">
          <SettingsSelect
            ariaLabel="Language"
            value={language}
            onChange={setLanguage}
            options={[
              { value: 'en', label: 'English' },
              { value: 'zh', label: '简体中文' },
            ]}
          />
        </SettingsRow>
        <SettingsRow label="New project">
          <SettingsSelect
            ariaLabel="New project position"
            value={newProjectPosition}
            onChange={setNewProjectPosition}
            options={[
              { value: 'first', label: 'Add to top' },
              { value: 'last', label: 'Add to bottom' },
            ]}
          />
        </SettingsRow>
      </SettingsSection>

      <SettingsSection title="Open">
        <SettingsRow align="start" label="Quick open" help="Shown on hover over a worktree row.">
          <div className="flex min-w-0 flex-1 flex-wrap gap-1.5">
            {OPEN_TARGET_OPTIONS.map((option) => {
              const selected = quickOpen.includes(option.id)
              return (
                <button
                  key={option.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => toggleTarget(option.id)}
                  className={`grove-icon-scale flex cursor-pointer items-center gap-1.5 rounded-[var(--settings-control-radius)] px-2 py-[5px] text-[length:var(--settings-label-size)] font-medium transition-colors ${
                    selected
                      ? 'bg-[var(--accent-soft)] text-[#1c1c1e] shadow-[inset_0_0_0_1px_var(--accent)]'
                      : 'bg-black/[0.04] text-black/55 hover:bg-black/[0.06]'
                  }`}
                >
                  <OpenTargetIcon target={option.id} /> {option.label}
                </button>
              )
            })}
          </div>
        </SettingsRow>
      </SettingsSection>

      <SettingsSection title="Workflows">
        <SettingsRow label="Archive">
          <SettingsSelect
            ariaLabel="Default archive policy"
            value={archivePolicy}
            onChange={setArchivePolicy}
            options={[
              { value: 'ask', label: 'Ask each time' },
              { value: 'hide', label: 'Hide worktree' },
              { value: 'remove_worktree', label: 'Remove worktree' },
            ]}
          />
        </SettingsRow>
        <SettingsRow label="Remove" help="What happens when you remove a project.">
          <SettingsSelect
            ariaLabel="Remove project behavior"
            value={removeBehavior}
            onChange={setRemoveBehavior}
            options={[
              { value: 'grove_only', label: 'From Grove only' },
              { value: 'delete_worktrees', label: 'Delete worktrees' },
            ]}
          />
        </SettingsRow>
      </SettingsSection>

      <SettingsSection title="Ghostty">
        <SettingsSwitchRow
          ariaLabel="Open Ghostty in tabs"
          icon={<OpenTargetIcon target="ghostty" />}
          title="Open in tabs"
          help="Reuse one Ghostty window instead of opening new windows."
          isSelected={ghosttyTab}
          onChange={setGhosttyTab}
        />
      </SettingsSection>

      <SettingsFooter>
        <SettingsButton onPress={onClose}>Close</SettingsButton>
      </SettingsFooter>
    </SettingsSheet>
  )
}
