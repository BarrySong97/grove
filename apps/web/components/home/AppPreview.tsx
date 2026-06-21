'use client'

import { useEffect, useState } from 'react'
import { BottomSheet } from '@grove/ui'
import {
  PROJECTS,
  SCRIPTED_PROJECT_ID,
  SCRIPTED_WORKTREE_ID,
  type AppPreviewDemoMode,
  type AppPreviewDemoPhase,
  type AppPreviewDemoStep,
  type Project,
} from './app-preview/data'
import { PanelHeader } from './app-preview/PanelHeader'
import { ProjectSection } from './app-preview/ProjectSection'
import { PanelFooter } from './app-preview/PanelFooter'
import { GlobalSettings } from './app-preview/settings/GlobalSettings'

/**
 * Non-interactive marketing preview of the Grove desktop app — a faithful port of
 * the real menu-bar panel (glass shell, collapse animation, hover actions, settings
 * bottom sheet, real open-target icons) built on the shared @grove/ui package, with
 * fake data and no real git/Tauri actions. Demo props let marketing sections scrub
 * the same panel through a guided workflow without forking the UI.
 */
const makeBlankProject = (index: number, id = `interactive-project-${index}`): Project => ({
  id,
  name: index === 1 ? 'untitled-project' : `untitled-project-${index}`,
  path: index === 1 ? '~/code/untitled-project' : `~/code/untitled-project-${index}`,
  accent: '#4f6f8f',
  worktrees: [],
})

const makeNewWorktree = (id: string, index = 1) => ({
  id,
  branch: index === 1 ? 'feat/new-worktree' : `feat/new-worktree-${index}`,
  base: 'main',
  status: 'setting-up' as const,
  time: 'now',
  message: '',
})

const SCRIPTED_PROJECT_REVEAL_MS = 1440
const SCRIPTED_WORKTREE_REVEAL_MS = 1440

const scriptedProjectForStep = (demoStep?: AppPreviewDemoStep, worktreeVisible = false): Project | null => {
  if (!demoStep) return null

  const project = makeBlankProject(1, SCRIPTED_PROJECT_ID)
  if (demoStep === 'create-worktree' && worktreeVisible) {
    return { ...project, worktrees: [makeNewWorktree(SCRIPTED_WORKTREE_ID)] }
  }
  if (demoStep === 'open-archive') {
    return {
      ...project,
      worktrees: [{ ...makeNewWorktree(SCRIPTED_WORKTREE_ID), status: 'ready', message: 'ready to open' }],
    }
  }
  return project
}

const projectsForScriptedStep = (
  demoStep?: AppPreviewDemoStep,
  projectVisible = false,
  worktreeVisible = false,
) => {
  if (!demoStep) return PROJECTS
  if (demoStep !== 'open-archive' && !projectVisible) return PROJECTS

  const scriptedProject = scriptedProjectForStep(demoStep, worktreeVisible)
  return scriptedProject ? [scriptedProject, ...PROJECTS] : PROJECTS
}

export function AppPreview({
  demoMode = 'interactive',
  demoPhase = 'idle',
  demoStep,
}: {
  demoMode?: AppPreviewDemoMode
  demoPhase?: AppPreviewDemoPhase
  demoStep?: AppPreviewDemoStep
}) {
  const [interactiveProjects, setInteractiveProjects] = useState<Project[]>(PROJECTS)
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const [projectRevealStep, setProjectRevealStep] = useState<AppPreviewDemoStep | null>(null)
  const [worktreeRevealStep, setWorktreeRevealStep] = useState<AppPreviewDemoStep | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const isDemo = demoMode !== 'interactive' && !!demoStep
  const isScrollDemo = demoMode === 'scroll' && !!demoStep
  const scriptedProjectVisible =
    isScrollDemo &&
    (demoStep === 'create-worktree' ||
      demoStep === 'open-archive' ||
      (demoStep === 'add-project' && projectRevealStep === 'add-project'))
  const scriptedWorktreeVisible =
    isScrollDemo &&
    (demoStep === 'open-archive' ||
      (demoStep === 'create-worktree' && worktreeRevealStep === 'create-worktree'))
  const projects =
    demoMode === 'interactive'
      ? interactiveProjects
      : isScrollDemo
        ? projectsForScriptedStep(demoStep, scriptedProjectVisible, scriptedWorktreeVisible)
        : PROJECTS
  const total = projects.reduce((n, p) => n + p.worktrees.length, 0)

  useEffect(() => {
    if (!isScrollDemo || demoStep !== 'add-project') return

    const timer = window.setTimeout(() => setProjectRevealStep('add-project'), SCRIPTED_PROJECT_REVEAL_MS)
    return () => window.clearTimeout(timer)
  }, [demoStep, isScrollDemo])

  useEffect(() => {
    if (!isScrollDemo || demoStep !== 'create-worktree') return

    const timer = window.setTimeout(() => setWorktreeRevealStep('create-worktree'), SCRIPTED_WORKTREE_REVEAL_MS)
    return () => window.clearTimeout(timer)
  }, [demoStep, isScrollDemo])

  const addProject = () => {
    setInteractiveProjects((current) => {
      const nextIndex = current.filter((project) => project.id.startsWith('interactive-project-')).length + 1
      return [makeBlankProject(nextIndex), ...current]
    })
  }

  const addWorktree = (projectId: string) => {
    setInteractiveProjects((current) =>
      current.map((project) => {
        if (project.id !== projectId) return project

        const nextIndex = project.worktrees.filter((worktree) => worktree.id.startsWith(`${projectId}-worktree-`)).length + 1
        return {
          ...project,
          worktrees: [
            ...project.worktrees,
            {
              id: `${projectId}-worktree-${nextIndex}`,
              branch: nextIndex === 1 ? 'feat/new-worktree' : `feat/new-worktree-${nextIndex}`,
              base: 'main',
              status: 'setting-up',
              time: 'now',
              message: '',
            },
          ],
        }
      }),
    )
  }

  return (
    <div className="grove-ui w-[330px] max-w-full">
      <div className="glass-surface animate-panel-in relative flex h-[600px] max-h-[600px] flex-col overflow-hidden rounded-[var(--window-radius)] border-[0.5px] p-1.5 font-sans text-[13.5px] text-[#1c1c1e] antialiased shadow-[var(--shadow-panel)]">
        <div className="shrink-0">
          <PanelHeader
            total={total}
            projectCount={projects.length}
            demoPhase={demoPhase}
            demoStep={demoStep}
            onAddProject={isDemo ? undefined : addProject}
            onOpenSettings={() => setSettingsOpen(true)}
          />
        </div>
        <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto">
          {projects.map((project, i) => (
            <ProjectSection
              key={project.id}
              project={project}
              collapsed={isDemo ? project.id !== 'acme-web' && project.id !== SCRIPTED_PROJECT_ID : !!collapsed[project.id]}
              isFirst={i === 0}
              isLast={i === projects.length - 1}
              demoPhase={demoPhase}
              demoStep={demoStep}
              forceExpanded={isDemo && (project.id === 'acme-web' || project.id === SCRIPTED_PROJECT_ID)}
              onNewWorktree={isDemo ? undefined : addWorktree}
              revealDelay={
                isScrollDemo && demoStep === 'add-project' && project.id === SCRIPTED_PROJECT_ID
                  ? 0
                  : undefined
              }
              onToggle={
                isDemo
                  ? () => {}
                  : () => setCollapsed((c) => ({ ...c, [project.id]: !c[project.id] }))
              }
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
