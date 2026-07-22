/* Faithful project-overview port — every project as a chip grid for one-tap jumping. */
import { Dot } from '@grove/ui'
import type { Project } from './data'

export function ProjectOverview({
  projects,
  onSelect,
}: {
  projects: Project[]
  onSelect?: (projectId: string) => void
}) {
  return (
    <div className="flex max-h-[min(70vh,460px)] flex-col">
      <p className="px-1 pb-2 pt-0.5 text-[11px] font-medium text-black/45">
        Projects · {projects.length}
      </p>
      <div className="no-scrollbar grid min-h-0 flex-1 grid-cols-2 gap-0.5 overflow-y-auto">
        {projects.map((project) => (
          <button
            key={project.id}
            type="button"
            onClick={() => onSelect?.(project.id)}
            className="flex min-w-0 cursor-pointer items-center gap-[7px] rounded-lg px-2.5 py-[7px] text-left text-[12px] font-semibold text-[#1c1c1e] transition-colors hover:bg-black/[0.06]"
          >
            <Dot color={project.accent} />
            <span className="min-w-0 flex-1 truncate">{project.name}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
