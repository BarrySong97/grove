/**
 * @purpose Renders per-project command configuration controls.
 * @role    Settings subview for editing in-memory run/setup/archive command strings.
 * @deps    Worktrees model command catalog, shared icons/ui
 * @gotcha  Changes are not persisted and do not execute shell commands; docs/modules/worktrees/README.md
 */
import type { Project } from '../model'
import { COMMAND_PLACEHOLDERS, COMMANDS } from '../model'
import { ChevronLeft } from '../../../shared/icons'
import { Divider } from '../../../shared/ui/Divider'
import { Dot } from '../../../shared/ui/Dot'

interface ProjectSettingsProps {
  project: Project
  onChange: (projectId: string, patch: Partial<Project['commands']>) => void
  onClose: () => void
}

export function ProjectSettings({ project, onChange, onClose }: ProjectSettingsProps) {
  return (
    <div className="p-0.5">
      <div className="flex items-center px-0.5 pb-1 pt-0.5">
        <button
          onClick={onClose}
          className="flex items-center gap-[3px] rounded-[7px] py-1.5 pl-[5px] pr-2.5 text-[12.5px] font-medium text-black/50 transition-colors hover:bg-black/[0.038] hover:text-black/90"
        >
          <ChevronLeft className="text-black/[0.34]" /> Projects
        </button>
      </div>

      <div className="flex items-center gap-2 px-2.5 pb-2.5 pt-0.5">
        <Dot color={project.accent} className="h-2 w-2" />
        <span className="text-[14px] font-semibold tracking-[-0.1px]">{project.name}</span>
        <span className="font-mono text-[10.5px] text-black/[0.22]">{project.path}</span>
      </div>

      <Divider />

      <div className="px-2.5 pb-1 pt-2 text-[10.5px] font-semibold uppercase tracking-[0.5px] text-black/[0.34]">
        Commands
      </div>

      {COMMANDS.map((command) => (
        <div key={command.id} className="px-2.5 py-[7px]">
          <div className="flex items-center gap-2.5">
            <span className="flex w-[70px] shrink-0 items-center gap-[7px] text-[12.5px] font-semibold text-[#1c1c1e]">
              <Dot color={command.color} />
              {command.name}
            </span>
            <label className="flex min-w-0 flex-1 items-center rounded-lg bg-black/[0.04] px-2.5 py-[7px] shadow-[inset_0_0_0_0.5px_rgba(0,0,0,0.09)] transition focus-within:bg-[var(--glass-surface-strong)] focus-within:shadow-[inset_0_0_0_1.4px_var(--accent)] focus-within:backdrop-blur-xl">
              <span className="mr-[7px] shrink-0 font-mono text-[12px] text-black/[0.22]">$</span>
              <input
                value={project.commands[command.id]}
                placeholder={COMMAND_PLACEHOLDERS[command.id]}
                spellCheck={false}
                autoComplete="off"
                onChange={(event) => onChange(project.id, { [command.id]: event.target.value })}
                className="min-w-0 flex-1 bg-transparent font-mono text-[12px] text-[#1c1c1e] outline-none placeholder:text-black/[0.22]"
              />
            </label>
          </div>
          <div className="pl-20 pt-[5px] text-[10.5px] leading-[1.35] text-black/[0.22]">{command.desc}.</div>
        </div>
      ))}

      <div className="flex justify-end px-1.5 pb-1 pt-2.5">
        <button
          onClick={onClose}
          className="rounded-lg bg-accent px-[18px] py-[7px] text-[12.5px] font-semibold text-white"
        >
          Done
        </button>
      </div>
    </div>
  )
}
