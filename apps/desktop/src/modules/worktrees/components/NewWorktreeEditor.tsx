/**
 * @purpose Renders the inline new-worktree editor.
 * @role    Focused form for branch name and local/remote base branch selection within a ProjectSection.
 * @deps    Hero UI Form/Button/Input, TanStack Query, native select, React Hook Form, react-i18next, Worktrees API/contracts/domain rules
 * @gotcha  Remote refs are read from Rust without fetching; Enter submits and Escape cancels locally.
 */
import { Button } from '@heroui/react/button'
import { Form } from '@heroui/react/form'
import { Input } from '@heroui/react/input'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import type { Project } from '../../../shared/contracts/worktrees'
import { listBaseBranches } from '../api/groveCommands'
import { worktreeQueryKeys } from '../api/queryKeys'
import { getCurrentWorktree } from '../domain/worktree-rules'

interface NewWorktreeEditorProps {
  project: Project
  onCreate: (project: Project, name: string, base: string) => void
  onCancel: () => void
}

interface NewWorktreeEditorValues {
  name: string
  base: string
}

export function NewWorktreeEditor({ project, onCreate, onCancel }: NewWorktreeEditorProps) {
  const { t } = useTranslation()
  const fallbackBaseBranches = useMemo(() => fallbackBranches(project), [project])
  const branchesQuery = useQuery({
    queryKey: worktreeQueryKeys.baseBranches(project.id),
    queryFn: () => listBaseBranches(project.id),
    staleTime: 30_000
  })
  const baseBranches = useMemo(
    () => uniqueBranches([...(branchesQuery.data ?? []), ...fallbackBaseBranches]),
    [branchesQuery.data, fallbackBaseBranches]
  )
  const defaultBase = preferredBase(project, baseBranches)
  const { formState, handleSubmit, register, setFocus, setValue, watch } =
    useForm<NewWorktreeEditorValues>({
      defaultValues: { name: '', base: defaultBase },
      mode: 'onChange'
    })
  const name = watch('name')
  const selectedBase = watch('base')
  const baseDirty = Boolean(formState.dirtyFields.base)

  useEffect(() => {
    if (baseBranches.length === 0) return
    if (baseDirty) {
      if (!baseBranches.includes(selectedBase))
        setValue('base', defaultBase, { shouldDirty: false })
      return
    }
    if (selectedBase !== defaultBase) setValue('base', defaultBase, { shouldDirty: false })
  }, [baseBranches, baseDirty, defaultBase, selectedBase, setValue])

  useEffect(() => {
    setFocus('name')
  }, [setFocus])

  const submit = (values: NewWorktreeEditorValues) => {
    const value = values.name.trim()
    if (value) onCreate(project, value, values.base)
  }

  return (
    <Form
      onClick={(event) => event.stopPropagation()}
      onSubmit={handleSubmit(submit)}
      className="my-0.5 flex flex-col gap-1.5 rounded-[9px] border border-transparent bg-transparent px-2 py-1.5 shadow-editor"
    >
      <div className="flex min-w-0 items-center gap-1.5">
        <span className="flex shrink-0 items-center gap-1 text-[10.5px] text-black/[0.34]">
          {t('newWorktree.basePrefix')}
          <select
            {...register('base')}
            className="grove-field-thin-focus h-[21px] max-w-[104px] appearance-auto rounded-md border-0 bg-white px-1.5 py-0 font-mono text-[10.5px] leading-none text-[#1c1c1e] shadow-[inset_0_0_0_0.5px_rgba(0,0,0,0.08)] outline-none transition hover:bg-white focus:bg-white"
          >
            {baseBranches.map((branch) => (
              <option key={branch} value={branch}>
                {branch}
              </option>
            ))}
          </select>
        </span>
        <Input
          {...register('name', {
            validate: (value) => value.trim().length > 0
          })}
          spellCheck={false}
          autoComplete="off"
          placeholder={t('newWorktree.placeholder')}
          onKeyDown={(event) => {
            if (event.key === 'Escape') onCancel()
          }}
          className="grove-field-thin-focus min-w-0 flex-1 rounded-md bg-white px-2 py-[4px] font-mono text-[10.5px] text-[#1c1c1e] shadow-[inset_0_0_0_0.5px_rgba(0,0,0,0.08)] transition placeholder:text-black/[0.34] hover:bg-white focus:bg-white"
        />
      </div>

      <div className="flex justify-end gap-1 leading-none">
        <Button
          type="submit"
          isDisabled={!name.trim()}
          size="sm"
          variant="primary"
          className="h-auto min-w-0 rounded-md bg-accent px-2.5 py-[4px] text-[11px] font-semibold text-white disabled:opacity-40"
        >
          {t('common.confirm')}
        </Button>
        <Button
          type="button"
          onClick={onCancel}
          size="sm"
          variant="secondary"
          className="h-auto min-w-0 rounded-md bg-transparent px-2.5 py-[4px] text-[11px] font-medium text-[#1c1c1e] hover:bg-black/[0.038] hover:text-[#1c1c1e]"
        >
          {t('common.cancel')}
        </Button>
      </div>
    </Form>
  )
}

function fallbackBranches(project: Project) {
  return uniqueBranches([
    project.defaultBranch,
    getCurrentWorktree(project)?.branch,
    ...project.worktrees.map((worktree) => worktree.branch)
  ])
}

function preferredBase(project: Project, branches: string[]) {
  const remoteDefault = project.defaultBranch.includes('/')
    ? project.defaultBranch
    : `origin/${project.defaultBranch}`
  return (
    branches.find((branch) => branch === remoteDefault) ??
    branches.find((branch) => branch === project.defaultBranch) ??
    branches[0] ??
    project.defaultBranch
  )
}

function uniqueBranches(branches: Array<string | undefined>) {
  return branches.filter(
    (branch, index, allBranches): branch is string =>
      Boolean(branch) && allBranches.indexOf(branch) === index
  )
}
