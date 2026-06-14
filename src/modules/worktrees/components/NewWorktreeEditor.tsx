/**
 * @purpose Renders the inline new-worktree editor.
 * @role    Focused form for branch name and base branch selection within a ProjectSection.
 * @deps    React state/effect/ref, Worktrees model helpers, shared icons
 * @gotcha  Enter submits and Escape cancels locally; docs/modules/worktrees/README.md
 */
import { useEffect, useRef, useState } from 'react'
import type { Project } from '../model'
import { getCurrentWorktree } from '../model'
import { Branch } from '../../../shared/icons'

interface NewWorktreeEditorProps {
  project: Project
  onCreate: (project: Project, name: string, base: string) => void
  onCancel: () => void
}

export function NewWorktreeEditor({ project, onCreate, onCancel }: NewWorktreeEditorProps) {
  const [name, setName] = useState('')
  const [base, setBase] = useState(getCurrentWorktree(project).branch)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const submit = () => {
    const value = name.trim()
    if (value) onCreate(project, value, base)
  }

  return (
    <div
      onClick={(event) => event.stopPropagation()}
      className="glass-surface-strong my-0.5 flex items-center gap-2.5 rounded-[9px] border-[0.5px] px-2.5 py-2 shadow-editor"
    >
      <span className="flex w-4 shrink-0 items-center justify-center text-accent">
        <Branch />
      </span>
      <input
        ref={inputRef}
        value={name}
        spellCheck={false}
        autoComplete="off"
        placeholder="feat/branch-name"
        onChange={(event) => setName(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') submit()
          if (event.key === 'Escape') onCancel()
        }}
        className="min-w-0 flex-1 bg-transparent font-mono text-[12.5px] text-[#1c1c1e] outline-none placeholder:text-black/[0.22]"
      />
      <span className="flex shrink-0 items-center gap-1 text-[11px] text-black/[0.34]">
        from
        <select
          value={base}
          onChange={(event) => setBase(event.target.value)}
          className="max-w-[96px] rounded-md border-[0.5px] border-black/[0.16] bg-black/[0.02] px-1.5 py-[3px] font-mono text-[11px] text-[#1c1c1e] outline-none"
        >
          {project.worktrees.map((worktree) => (
            <option key={worktree.id} value={worktree.branch}>
              {worktree.branch}
            </option>
          ))}
        </select>
      </span>
      <button
        onClick={onCancel}
        className="shrink-0 rounded-[7px] px-2.5 py-1.5 text-[12px] font-medium text-black/50 transition-colors hover:bg-black/[0.05] hover:text-black/80"
      >
        Cancel
      </button>
      <button
        onClick={submit}
        disabled={!name.trim()}
        className="shrink-0 rounded-[7px] bg-accent px-3 py-1.5 text-[12px] font-semibold text-white disabled:opacity-40"
      >
        Create
      </button>
    </div>
  )
}
