/**
 * @purpose Renders the project overview sheet: every project as a chip grid for one-tap jumping.
 * @role    Bottom-sheet content in WorktreePanel; selecting a chip closes the sheet and scrolls to that project.
 * @deps    react-i18next, worktrees contracts, shared Dot
 * @gotcha  Presentation only; the jump/scroll lives in WorktreePanel; docs/modules/worktrees/README.md
 */
import { useTranslation } from 'react-i18next'
import type { Project } from '../../../shared/contracts/worktrees'
import { Dot } from '../../../shared/ui/Dot'

interface ProjectOverviewProps {
  projects: Project[]
  onSelect: (projectId: string) => void
}

export function ProjectOverview({ projects, onSelect }: ProjectOverviewProps) {
  const { t } = useTranslation()

  return (
    <div className="flex max-h-[min(70vh,460px)] flex-col">
      <p className="px-1 pb-2 pt-0.5 text-[11px] font-medium text-black/45">
        {t('overview.title', { count: projects.length })}
      </p>
      <div className="no-scrollbar grid min-h-0 flex-1 grid-cols-2 gap-0.5 overflow-y-auto">
        {projects.map((project) => (
          <button
            key={project.id}
            type="button"
            onClick={() => onSelect(project.id)}
            className="flex min-w-0 items-center gap-[7px] rounded-lg px-2.5 py-[7px] text-left text-[12px] font-semibold text-[#1c1c1e] transition-colors hover:bg-black/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          >
            <Dot color={project.accent} />
            <span className="min-w-0 flex-1 truncate">{project.name}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
