'use client'

import { useState } from 'react'
import { BottomSheet } from '@grove/ui'
import { PROJECTS } from './app-preview/data'
import { PanelHeader } from './app-preview/PanelHeader'
import { ProjectSection } from './app-preview/ProjectSection'
import { PanelFooter } from './app-preview/PanelFooter'
import { GlobalSettings } from './app-preview/settings/GlobalSettings'

/**
 * Non-interactive marketing preview of the Grove desktop app — a faithful port of
 * the real menu-bar panel (glass shell, collapse animation, hover actions, settings
 * bottom sheet, real open-target icons) built on the shared @grove/ui package, with
 * fake data and no real git/Tauri actions.
 */
export function AppPreview() {
  const total = PROJECTS.reduce((n, p) => n + p.worktrees.length, 0)
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const [settingsOpen, setSettingsOpen] = useState(false)

  return (
    <div className="grove-ui w-[330px] max-w-full">
      <div className="glass-surface animate-panel-in relative flex max-h-[600px] flex-col overflow-hidden rounded-[var(--window-radius)] border-[0.5px] p-1.5 font-sans text-[13.5px] text-[#1c1c1e] antialiased shadow-[var(--shadow-panel)]">
        <div className="shrink-0">
          <PanelHeader
            total={total}
            projectCount={PROJECTS.length}
            onOpenSettings={() => setSettingsOpen(true)}
          />
        </div>
        <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto">
          {PROJECTS.map((project, i) => (
            <ProjectSection
              key={project.id}
              project={project}
              collapsed={!!collapsed[project.id]}
              isFirst={i === 0}
              isLast={i === PROJECTS.length - 1}
              onToggle={() => setCollapsed((c) => ({ ...c, [project.id]: !c[project.id] }))}
            />
          ))}
        </div>
        <div className="shrink-0">
          <PanelFooter />
        </div>

        <BottomSheet
          ariaLabel="Settings"
          containment="absolute"
          isOpen={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          maxHeightClassName="max-h-[92%]"
          className="bottom-sheet-surface rounded-[var(--window-radius)] border-[0.5px] p-1.5 text-[13.5px] text-[#1c1c1e] shadow-[var(--shadow-panel)]"
        >
          <GlobalSettings onClose={() => setSettingsOpen(false)} />
        </BottomSheet>
      </div>
    </div>
  )
}
