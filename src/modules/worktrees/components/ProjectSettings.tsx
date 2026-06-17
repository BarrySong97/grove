/**
 * @purpose Renders per-project persisted configuration controls with validated Hero UI fields.
 * @role    Settings subview for editing workspace root, commands, and archive policy.
 * @deps    Hero UI Form/Input/Button, native select, React Hook Form, Worktrees contracts/domain command catalog, shared icons/ui
 * @gotcha  Saves Grove overrides only; settings density comes from src/index.css tokens.
 */
import { Button } from '@heroui/react/button'
import { FieldError } from '@heroui/react/field-error'
import { Form } from '@heroui/react/form'
import { Input } from '@heroui/react/input'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import type { Project } from '../../../shared/contracts/worktrees'
import { ChevronLeft } from '../../../shared/icons'
import { Divider } from '../../../shared/ui/Divider'
import { Dot } from '../../../shared/ui/Dot'
import { COMMAND_PLACEHOLDERS, COMMANDS } from '../domain/commands'

interface ProjectSettingsProps {
  project: Project
  onSave: (
    projectId: string,
    input: {
      workspaceRoot: string
      archivePolicy: Project['archivePolicy']
      commands: Project['commands']
    }
  ) => void
  onClose: () => void
}

interface ProjectSettingsValues {
  workspaceRoot: string
  archivePolicy: Project['archivePolicy']
  commands: Project['commands']
}

const archivePolicies: Array<{ id: Project['archivePolicy']; label: string }> = [
  { id: 'ask', label: 'Ask' },
  { id: 'hide', label: 'Hide' },
  { id: 'remove_worktree', label: 'Remove worktree' }
]

function getProjectSettingsValues(project: Project): ProjectSettingsValues {
  return {
    workspaceRoot: project.workspaceRoot,
    archivePolicy: project.archivePolicy,
    commands: project.commands
  }
}

export function ProjectSettings({ project, onSave, onClose }: ProjectSettingsProps) {
  const {
    formState: { errors, isValid },
    handleSubmit,
    register,
    reset
  } = useForm<ProjectSettingsValues>({
    defaultValues: getProjectSettingsValues(project),
    mode: 'onChange'
  })

  useEffect(() => {
    reset(getProjectSettingsValues(project))
  }, [project, reset])

  const save = (values: ProjectSettingsValues) =>
    onSave(project.id, {
      workspaceRoot: values.workspaceRoot.trim(),
      archivePolicy: values.archivePolicy,
      commands: values.commands
    })

  return (
    <Form className="p-0.5" onSubmit={handleSubmit(save)}>
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
        <div className="flex min-w-0 items-center gap-2">
          <Dot color={project.accent} className="h-2 w-2" />
          <span className="grove-settings-title min-w-0 flex-1 truncate">{project.name}</span>
        </div>
        <span className="grove-settings-subtitle font-mono">{project.path}</span>
      </div>

      <Divider />

      <div className="grove-settings-section-title">Project</div>

      <div className="grove-settings-row">
        <div className="grove-settings-row-inner">
          <span className="grove-settings-label">Workspace root</span>
          <Input
            {...register('workspaceRoot', {
              validate: (value) => value.trim().length > 0 || 'Workspace root is required'
            })}
            aria-invalid={Boolean(errors.workspaceRoot)}
            autoComplete="off"
            className="grove-field-thin-focus grove-settings-field min-w-0 flex-1 font-mono placeholder:text-black/[0.34]"
            data-invalid={Boolean(errors.workspaceRoot)}
            spellCheck={false}
            variant="secondary"
          />
        </div>
        {errors.workspaceRoot && (
          <FieldError className="grove-settings-error">{errors.workspaceRoot.message}</FieldError>
        )}
      </div>

      <div className="grove-settings-row">
        <div className="grove-settings-row-inner">
          <span className="grove-settings-label">Archive</span>
          <select
            {...register('archivePolicy')}
            className="grove-field-thin-focus grove-settings-field min-w-0 flex-1 appearance-auto border-0 font-medium"
          >
            {archivePolicies.map((policy) => (
              <option key={policy.id} value={policy.id}>
                {policy.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <Divider />

      <div className="grove-settings-section-title">Commands</div>

      {COMMANDS.map((command) => (
        <div key={command.id} className="grove-settings-row">
          <div className="grove-settings-row-inner">
            <span className="grove-settings-command-label">
              <Dot color={command.color} />
              {command.name}
            </span>
            <label className="grove-field-group-thin-focus grove-settings-field flex min-w-0 flex-1 items-center">
              <span className="mr-[7px] shrink-0 font-mono text-[length:var(--settings-control-size)] text-black/[0.22]">
                $
              </span>
              <input
                {...register(`commands.${command.id}`)}
                autoComplete="off"
                className="min-w-0 flex-1 rounded-none border-0 bg-transparent p-0 font-mono text-[length:var(--settings-control-size)] text-[#1c1c1e] shadow-none outline-none placeholder:text-black/[0.34] focus:bg-transparent focus:shadow-none focus:outline-none"
                placeholder={COMMAND_PLACEHOLDERS[command.id]}
                spellCheck={false}
              />
            </label>
          </div>
          <div className="grove-settings-help">{command.desc}.</div>
        </div>
      ))}

      <div className="flex justify-end px-1.5 pb-1 pt-2.5">
        <Button
          className="h-auto rounded-[var(--settings-control-radius)] bg-accent px-[16px] py-[6px] text-[length:var(--settings-label-size)] font-semibold text-white disabled:opacity-40"
          isDisabled={!isValid}
          size="sm"
          type="submit"
          variant="primary"
        >
          Save
        </Button>
      </div>
    </Form>
  )
}
