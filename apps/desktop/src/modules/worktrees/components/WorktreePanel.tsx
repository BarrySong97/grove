/**
 * @purpose Composes the full Grove worktree panel UI.
 * @role    Feature root component; wires state hook, project sorting, type-ahead/overview jump aids, settings sheets, toast, and context menu.
 * @deps    @dnd-kit/core/sortable, Hero UI Button, Worktrees contracts/state/API, shared UI/lib/icons
 * @gotcha  Settings and action overlays use BottomSheet so the panel context stays visible; type-ahead and overview jump via the shared sectionEls/scrollRef; docs/modules/worktrees/README.md
 */
import { Button } from '@heroui/react/button'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent
} from '@dnd-kit/core'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy
} from '@dnd-kit/sortable'
import type { Density, Project } from '../../../shared/contracts/worktrees'
import { useWorktreePanelState } from '../hooks/useWorktreePanelState'
import { sortableMeasuring } from '../../../shared/lib/sortable'
import { hexA } from '../../../shared/lib/color'
import type { CSSVars } from '../../../shared/lib/styles'
import { Search, Spinner } from '../../../shared/icons'
import { BottomSheet } from '../../../shared/ui/BottomSheet'
import { Toast } from '../../../shared/ui/Toast'
import { ContextMenu } from './ContextMenu'
import { GlobalSettings } from './GlobalSettings'
import { PanelFooter } from './PanelFooter'
import { PanelHeader } from './PanelHeader'
import { PanelShell } from './PanelShell'
import { ProjectOverview } from './ProjectOverview'
import { ProjectSection } from './ProjectSection'
import { ProjectSettings } from './ProjectSettings'
import { ArchiveChoice } from './settings/ArchiveChoice'
import { LogViewer } from './settings/LogViewer'
import { RemoveProjectChoice } from './settings/RemoveProjectChoice'

const prefersReducedMotion = () =>
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches

// How long the type-ahead buffer survives between keystrokes before resetting.
const TYPEAHEAD_RESET_MS = 1100

export interface WorktreePanelProps {
  accent?: string
  density?: Density
  showCommit?: boolean
  initialProjects?: Project[]
  onQuit?: () => void
}

export function WorktreePanel({
  accent = '#2f6fe0',
  density = 'comfortable',
  showCommit = true,
  initialProjects = [],
  onQuit
}: WorktreePanelProps) {
  const state = useWorktreePanelState(initialProjects)
  const { t } = useTranslation()
  const panelStyle: CSSVars = { '--accent': accent, '--accent-soft': hexA(accent, 0.1) }

  const [overviewOpen, setOverviewOpen] = useState(false)
  // Transient echo of the current type-ahead buffer; null hides the hint chip.
  const [typeahead, setTypeahead] = useState<{
    text: string
    index: number
    total: number
  } | null>(null)

  const scrollRef = useRef<HTMLDivElement>(null)
  const sectionEls = useRef(new Map<string, HTMLDivElement>())
  const lastFlashed = useRef<HTMLElement | null>(null)
  const registerSection = (projectId: string) => (el: HTMLDivElement | null) => {
    if (el) sectionEls.current.set(projectId, el)
    else sectionEls.current.delete(projectId)
  }

  const jumpToProject = useCallback((projectId: string) => {
    const el = sectionEls.current.get(projectId)
    const container = scrollRef.current
    if (!el || !container) return
    const top =
      el.getBoundingClientRect().top - container.getBoundingClientRect().top + container.scrollTop
    container.scrollTo({
      top: Math.max(0, top - 4),
      behavior: prefersReducedMotion() ? 'auto' : 'smooth'
    })
    // Only one project flashes at a time — clear the previous target first.
    if (lastFlashed.current && lastFlashed.current !== el) {
      lastFlashed.current.classList.remove('grove-jump-flash')
    }
    el.classList.remove('grove-jump-flash')
    void el.offsetWidth
    el.classList.add('grove-jump-flash')
    lastFlashed.current = el
  }, [])

  // Type-ahead find: latest project list read via ref so the keydown handler
  // stays stable; the buffer accumulates keystrokes and clears after a pause.
  // When several projects match, Up/Down and the wheel cycle through them.
  const projectsRef = useRef(state.projects)
  projectsRef.current = state.projects
  const typeaheadBuffer = useRef('')
  const typeaheadTimer = useRef<number | null>(null)
  const matchesRef = useRef<string[]>([])
  const matchIndexRef = useRef(0)

  const resetTypeahead = useCallback(() => {
    typeaheadBuffer.current = ''
    matchesRef.current = []
    matchIndexRef.current = 0
    if (typeaheadTimer.current) window.clearTimeout(typeaheadTimer.current)
    setTypeahead(null)
  }, [])

  const armReset = useCallback(() => {
    if (typeaheadTimer.current) window.clearTimeout(typeaheadTimer.current)
    typeaheadTimer.current = window.setTimeout(resetTypeahead, TYPEAHEAD_RESET_MS)
  }, [resetTypeahead])

  const runTypeahead = useCallback(
    (buffer: string) => {
      typeaheadBuffer.current = buffer
      if (!buffer) {
        resetTypeahead()
        return
      }
      const q = buffer.toLowerCase()
      const projects = projectsRef.current
      // Prefix matches first (most intuitive), then remaining substring matches;
      // display order is preserved within each group.
      const contains = projects.filter((p) => p.name.toLowerCase().includes(q))
      const matches = [
        ...contains.filter((p) => p.name.toLowerCase().startsWith(q)),
        ...contains.filter((p) => !p.name.toLowerCase().startsWith(q))
      ].map((p) => p.id)
      matchesRef.current = matches
      matchIndexRef.current = 0
      setTypeahead({ text: buffer, index: 0, total: matches.length })
      if (matches.length > 0) jumpToProject(matches[0])
      armReset()
    },
    [jumpToProject, resetTypeahead, armReset]
  )

  const cycleMatch = useCallback(
    (delta: number) => {
      const matches = matchesRef.current
      if (!typeaheadBuffer.current || matches.length === 0) return
      const next = (matchIndexRef.current + delta + matches.length) % matches.length
      matchIndexRef.current = next
      setTypeahead((prev) => (prev ? { ...prev, index: next } : prev))
      jumpToProject(matches[next])
      armReset()
    },
    [jumpToProject, armReset]
  )

  const openOverview = () => {
    resetTypeahead()
    setOverviewOpen(true)
  }

  useEffect(() => resetTypeahead, [resetTypeahead])

  // Type a few letters anywhere in an active panel to jump to the matching
  // project — no filtering, just scroll + flash. Yields when a sheet, editor,
  // or other input already owns the keyboard.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (overviewOpen || state.globalSettingsOpen || state.settingsProject) return
      if (state.ctx || state.archivePrompt || state.removeProjectPrompt || state.logViewer) return
      if (state.addingTo || state.projects.length === 0) return
      if (event.metaKey || event.ctrlKey || event.altKey) return
      const target = event.target as HTMLElement | null
      if (
        target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
      )
        return
      if (event.key === 'Escape') {
        if (typeaheadBuffer.current) {
          event.stopPropagation()
          resetTypeahead()
        }
        return
      }
      if (event.key === 'Backspace') {
        if (typeaheadBuffer.current) {
          event.preventDefault()
          runTypeahead(typeaheadBuffer.current.slice(0, -1))
        }
        return
      }
      // While a buffer is live, Up/Down cycle through the matching projects.
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        if (typeaheadBuffer.current && matchesRef.current.length > 1) {
          event.preventDefault()
          cycleMatch(event.key === 'ArrowDown' ? 1 : -1)
        }
        return
      }
      if (event.key.length === 1 && event.key.trim()) {
        runTypeahead(typeaheadBuffer.current + event.key)
      }
    }
    // While a buffer is live, the wheel cycles matches instead of scrolling.
    let wheelAccum = 0
    const onWheel = (event: WheelEvent) => {
      if (!typeaheadBuffer.current || matchesRef.current.length < 2) return
      event.preventDefault()
      wheelAccum += event.deltaY
      if (Math.abs(wheelAccum) < 24) return
      cycleMatch(wheelAccum > 0 ? 1 : -1)
      wheelAccum = 0
    }
    const container = scrollRef.current
    document.addEventListener('keydown', onKeyDown)
    container?.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      container?.removeEventListener('wheel', onWheel)
    }
  }, [
    overviewOpen,
    state.globalSettingsOpen,
    state.settingsProject,
    state.ctx,
    state.archivePrompt,
    state.removeProjectPrompt,
    state.logViewer,
    state.addingTo,
    state.projects.length,
    runTypeahead,
    resetTypeahead,
    cycleMatch
  ])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleProjectDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) state.reorderProjects(String(active.id), String(over.id))
  }

  return (
    <PanelShell
      style={panelStyle}
      scrollRef={scrollRef}
      header={
        <PanelHeader
          projectCount={state.projects.length}
          onAddProject={state.addProject}
          onOpenOverview={openOverview}
        />
      }
      footer={
        <PanelFooter
          language={state.appSettings.language}
          saving={state.appSettingsSaving}
          onLanguageChange={state.setLanguage}
          onOpenSettings={() => state.setGlobalSettingsOpen(true)}
          onQuit={onQuit}
        />
      }
    >
      {state.projects.length === 0 ? (
        <EmptyProjectList
          addProjectLabel={t('empty.addProject')}
          howItWorksLabel={t('empty.howItWorks')}
          importLabel={t('empty.importFromConductor')}
          orLabel={t('empty.or')}
          title={t('empty.headline')}
          onAddProject={state.addProject}
          onImport={state.importFromConductor}
        />
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          measuring={sortableMeasuring}
          modifiers={[restrictToVerticalAxis]}
          onDragEnd={handleProjectDragEnd}
        >
          <SortableContext
            items={state.projects.map((project) => project.id)}
            strategy={verticalListSortingStrategy}
          >
            {state.projects.map((project, index) => (
              <ProjectSection
                key={project.id}
                sectionRef={registerSection(project.id)}
                project={project}
                density={density}
                hoverQuickOpenTargets={state.appSettings.hoverQuickOpenTargets}
                showCommit={showCommit}
                isAdding={state.addingTo === project.id}
                collapsed={state.collapsedProjectIds.has(project.id)}
                activeContextWorktreeId={state.ctx?.worktree.id ?? null}
                isFirst={index === 0}
                isLast={index === state.projects.length - 1}
                onAddWorktree={state.setAddingTo}
                onCancelAdd={() => state.setAddingTo(null)}
                onCreateWorktree={state.createWorktree}
                onCollapsedChange={(collapsed) => state.setProjectCollapsed(project.id, collapsed)}
                onEditSettings={state.setSettingsFor}
                onMove={(direction) => state.moveProject(project.id, direction)}
                onMoveWorktree={(worktreeId, direction) =>
                  state.moveWorktree(project.id, worktreeId, direction)
                }
                onReorderWorktrees={(activeId, overId) =>
                  state.reorderWorktrees(project.id, activeId, overId)
                }
                onContext={(event, worktree, item) =>
                  state.setCtx({ x: event.clientX, y: event.clientY, worktree, project: item })
                }
                onOpenWorkspace={state.openWorktree}
              />
            ))}
          </SortableContext>
        </DndContext>
      )}

      {typeahead && (
        <div className="pointer-events-none absolute left-1/2 top-9 z-40 flex -translate-x-1/2 animate-panel-in items-center gap-1.5 rounded-lg border-[0.5px] border-white/10 bg-[rgba(28,28,32,0.9)] px-2.5 py-1.5 shadow-ctx backdrop-blur-xl">
          <Search className={typeahead.total > 0 ? 'text-[#7fb4ff]' : 'text-white/40'} />
          <span
            className={
              'font-mono text-[12px] font-semibold ' +
              (typeahead.total > 0 ? 'text-white' : 'text-white/45 line-through')
            }
          >
            {typeahead.text}
          </span>
          {typeahead.total > 1 && (
            <span className="font-mono text-[11px] tabular-nums text-white/50">
              {typeahead.index + 1}/{typeahead.total}
            </span>
          )}
        </div>
      )}

      <BottomSheet
        ariaLabel={t('overview.title', { count: state.projects.length })}
        className="bottom-sheet-surface rounded-[var(--window-radius)] border-[0.5px] p-2 font-sans text-[13.5px] text-[#1c1c1e] antialiased shadow-panel"
        isOpen={overviewOpen}
        onClose={() => setOverviewOpen(false)}
      >
        <ProjectOverview
          projects={state.projects}
          onSelect={(projectId) => {
            setOverviewOpen(false)
            jumpToProject(projectId)
          }}
        />
      </BottomSheet>

      {state.toast && (
        <Toast
          closeLabel={t('common.close')}
          tone={state.toast.tone}
          icon={
            state.toast.tone === 'progress' ? (
              <Spinner className="shrink-0 animate-spin text-[#7fb4ff]" />
            ) : null
          }
          onClose={state.clearToast}
        >
          {state.toast.message}
        </Toast>
      )}

      {state.ctx && (
        <ContextMenu
          ctx={state.ctx}
          onClose={() => state.setCtx(null)}
          onArchive={state.archiveWorktree}
          onRetry={state.retryWorktree}
          onViewLog={state.viewWorktreeLog}
          onOpenWorkspace={state.openWorktree}
          onEditCommands={(project) => {
            state.setCtx(null)
            state.setSettingsFor(project.id)
          }}
        />
      )}

      <BottomSheet
        ariaLabel={t('settings.title')}
        className="bottom-sheet-surface rounded-[var(--window-radius)] border-[0.5px] p-1.5 font-sans text-[13.5px] text-[#1c1c1e] antialiased shadow-panel"
        maxHeightClassName="max-h-[min(94vh,700px)]"
        isOpen={state.globalSettingsOpen}
        onClose={() => state.setGlobalSettingsOpen(false)}
      >
        <GlobalSettings
          settings={state.appSettings}
          saving={state.appSettingsSaving}
          onDefaultArchivePolicyChange={state.setDefaultArchivePolicy}
          onHoverQuickOpenTargetsChange={state.setHoverQuickOpenTargets}
          onLanguageChange={state.setLanguage}
          onNewProjectPositionChange={state.setNewProjectPosition}
          onRemoveProjectBehaviorChange={state.setRemoveProjectBehavior}
          onClose={() => state.setGlobalSettingsOpen(false)}
        />
      </BottomSheet>

      {state.archivePrompt && (
        <BottomSheet
          ariaLabel={t('sheets.archive.title')}
          className="bottom-sheet-surface rounded-[var(--window-radius)] border-[0.5px] p-2 font-sans text-[13.5px] text-[#1c1c1e] antialiased shadow-panel"
          elevated
          isOpen
          onClose={() => state.setArchivePrompt(null)}
        >
          <ArchiveChoice
            projectName={state.archivePrompt.project.name}
            worktreeBranch={state.archivePrompt.worktree.branch}
            onHide={() =>
              state.archiveWorktreeWithPolicy(
                state.archivePrompt!.worktree,
                state.archivePrompt!.project,
                'hide'
              )
            }
            onRemove={() =>
              state.archiveWorktreeWithPolicy(
                state.archivePrompt!.worktree,
                state.archivePrompt!.project,
                'remove_worktree'
              )
            }
            onCancel={() => state.setArchivePrompt(null)}
          />
        </BottomSheet>
      )}

      {state.removeProjectPrompt && (
        <BottomSheet
          ariaLabel={t('sheets.removeProject.title')}
          className="bottom-sheet-surface rounded-[var(--window-radius)] border-[0.5px] p-2 font-sans text-[13.5px] text-[#1c1c1e] antialiased shadow-panel"
          elevated
          isOpen
          onClose={() => state.setRemoveProjectPrompt(null)}
        >
          <RemoveProjectChoice
            behavior={state.appSettings.removeProjectBehavior}
            project={state.removeProjectPrompt.project}
            onCancel={() => state.setRemoveProjectPrompt(null)}
            onConfirm={() => state.confirmRemoveProject(state.removeProjectPrompt!.project)}
          />
        </BottomSheet>
      )}

      {state.logViewer && (
        <BottomSheet
          ariaLabel={t('sheets.log.title')}
          className="bottom-sheet-surface rounded-[var(--window-radius)] border-[0.5px] p-2 font-sans text-[13.5px] text-[#1c1c1e] antialiased shadow-panel"
          isOpen
          onClose={() => state.setLogViewer(null)}
        >
          <LogViewer
            title={state.logViewer.title}
            content={state.logViewer.content}
            onClose={() => state.setLogViewer(null)}
          />
        </BottomSheet>
      )}

      {state.settingsProject && (
        <BottomSheet
          ariaLabel={`${state.settingsProject.name} ${t('settings.title')}`}
          className="bottom-sheet-surface rounded-[var(--window-radius)] border-[0.5px] p-1.5 font-sans text-[13.5px] text-[#1c1c1e] antialiased shadow-panel"
          isOpen
          onClose={() => state.setSettingsFor(null)}
        >
          <ProjectSettings
            project={state.settingsProject}
            onRemoveProject={state.requestRemoveProject}
            onSave={state.saveProjectSettings}
            onClose={() => state.setSettingsFor(null)}
          />
        </BottomSheet>
      )}
    </PanelShell>
  )
}

function EmptyProjectList({
  title,
  importLabel,
  orLabel,
  addProjectLabel,
  howItWorksLabel,
  onAddProject,
  onImport
}: {
  title: string
  importLabel: string
  orLabel: string
  addProjectLabel: string
  howItWorksLabel: string
  onAddProject: () => void
  onImport: () => void
}) {
  return (
    <div className="flex min-h-full items-center justify-center px-6 py-10 text-center">
      <div className="space-y-2 text-[13px] leading-5 text-black/45">
        <p>
          <Button
            onPress={onImport}
            size="sm"
            variant="ghost"
            className="inline h-auto min-w-0 bg-transparent p-0 align-baseline font-medium text-accent underline underline-offset-2 outline-none transition-colors hover:bg-transparent hover:text-[#1c1c1e] focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          >
            {importLabel}
          </Button>{' '}
          {orLabel}{' '}
          <Button
            onPress={onAddProject}
            size="sm"
            variant="ghost"
            className="inline h-auto min-w-0 bg-transparent p-0 align-baseline font-medium text-accent underline underline-offset-2 outline-none transition-colors hover:bg-transparent hover:text-[#1c1c1e] focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          >
            {addProjectLabel}
          </Button>
        </p>
        <span className="sr-only">{title}</span>
        <a
          href="https://example.com/grove-worktrees"
          target="_blank"
          rel="noreferrer"
          className="inline-block font-medium text-black/45 underline underline-offset-2 transition-colors hover:text-[#1c1c1e]"
        >
          {howItWorksLabel}
        </a>
      </div>
    </div>
  )
}
