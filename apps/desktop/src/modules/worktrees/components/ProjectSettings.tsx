/**
 * @purpose Renders per-project configuration controls and remove-project entry point.
 * @role    Bottom sheet content for editing workspace root, setup/archive commands, and archive override.
 * @deps    Hero UI Form/Input, React Hook Form, react-i18next, Worktrees contracts/domain command catalog, shared Dot, local settings kit
 * @gotcha  Saves Grove overrides only; settings density comes from src/index.css tokens.
 */
import { Form } from '@heroui/react/form'
import { Input } from '@heroui/react/input'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import type { Project } from '../../../shared/contracts/worktrees'
import { Dot } from '../../../shared/ui/Dot'
import { COMMAND_PLACEHOLDERS, COMMANDS } from '../domain/commands'
import { SettingsButton } from './settings/SettingsButton'
import { SettingsFooter } from './settings/SettingsFooter'
import { SettingsHeader } from './settings/SettingsHeader'
import { SettingsRow } from './settings/SettingsRow'
import { SettingsSection } from './settings/SettingsSection'

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
  onRemoveProject: (project: Project) => void
}

interface ProjectSettingsValues {
  workspaceRoot: string
  archivePolicy: Project['archivePolicy']
  commands: Project['commands']
}

const archivePolicies: Array<{ id: Project['archivePolicy']; labelKey: string }> = [
  { id: 'use_global', labelKey: 'projectSettings.archive.useGlobal' },
  { id: 'ask', labelKey: 'projectSettings.archive.ask' },
  { id: 'hide', labelKey: 'projectSettings.archive.hide' },
  { id: 'remove_worktree', labelKey: 'projectSettings.archive.removeWorktree' }
]

function getProjectSettingsValues(project: Project): ProjectSettingsValues {
  return {
    workspaceRoot: project.workspaceRoot,
    archivePolicy: project.archivePolicy,
    commands: project.commands
  }
}

export function ProjectSettings({
  project,
  onSave,
  onClose,
  onRemoveProject
}: ProjectSettingsProps) {
  const { t } = useTranslation()
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
      <SettingsHeader
        dotColor={project.accent}
        title={project.name}
        subtitle={project.path}
        subtitleClassName="font-mono"
      />

      <SettingsSection title={t('projectSettings.sections.project')}>
        <SettingsRow
          layout="stacked"
          label={t('projectSettings.workspaceRoot.label')}
          error={errors.workspaceRoot?.message}
        >
          <Input
            {...register('workspaceRoot', {
              validate: (value) =>
                value.trim().length > 0 || t('projectSettings.workspaceRoot.required')
            })}
            aria-invalid={Boolean(errors.workspaceRoot)}
            aria-label={t('projectSettings.workspaceRoot.ariaLabel')}
            autoComplete="off"
            className="grove-field-thin-focus grove-settings-field min-w-0 flex-1 font-mono placeholder:text-black/[0.34]"
            data-invalid={Boolean(errors.workspaceRoot)}
            spellCheck={false}
            variant="secondary"
          />
        </SettingsRow>

        <SettingsRow layout="stacked" label={t('projectSettings.archive.label')}>
          <select
            {...register('archivePolicy')}
            aria-label={t('projectSettings.archive.label')}
            className="grove-field-thin-focus grove-settings-field min-w-0 flex-1 appearance-auto border-0 font-medium"
          >
            {archivePolicies.map((policy) => (
              <option key={policy.id} value={policy.id}>
                {t(policy.labelKey)}
              </option>
            ))}
          </select>
        </SettingsRow>
      </SettingsSection>

      <SettingsSection title={t('projectSettings.sections.commands')}>
        {COMMANDS.map((command) => (
          <SettingsRow
            key={command.id}
            layout="stacked"
            label={
              <>
                <Dot color={command.color} />
                {t(`projectSettings.commands.${command.id}Name`)}
              </>
            }
            help={`${t(`projectSettings.commands.${command.id}Desc`)}.`}
          >
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
          </SettingsRow>
        ))}
      </SettingsSection>

      <SettingsSection title={t('projectSettings.sections.danger')}>
        <SettingsRow layout="stacked" help={t('projectSettings.removeProject.help')}>
          <SettingsButton tone="danger" onPress={() => onRemoveProject(project)}>
            {t('projectSettings.removeProject.button')}
          </SettingsButton>
        </SettingsRow>
      </SettingsSection>

      <SettingsFooter>
        <SettingsButton onPress={onClose}>{t('common.close')}</SettingsButton>
        <SettingsButton tone="primary" type="submit" isDisabled={!isValid}>
          {t('common.confirm')}
        </SettingsButton>
      </SettingsFooter>
    </Form>
  )
}
