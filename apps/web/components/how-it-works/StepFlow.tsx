import { TerminalMock } from './TerminalMock'

const STEPS = [
  {
    n: '01',
    title: 'Add a project folder',
    body: 'Point Grove at any git repository. It discovers every worktree under it and groups them by project in the menu — collapse a project, see its branch count, jump straight to what you need.',
  },
  {
    n: '02',
    title: 'Create a new worktree',
    body: 'Name a branch and pick a base. Grove runs git worktree add for you, then fires your Setup script so dependencies and environment are ready before you ever open the folder.',
    term: true,
  },
  {
    n: '03',
    title: 'Click to switch — or right-click to act',
    body: 'Click any branch to make it current. Right-click to open it in your editor, terminal, or Finder, run a script, or archive it. Live git status badges tell you what’s safe to leave.',
  },
]

export function StepFlow() {
  return (
    <div className="mt-[76px]">
      <h2 className="text-[32px] font-[660] leading-[1.12] -tracking-[0.9px] text-balance">
        From clone to parallel in three steps
      </h2>
      <p className="mt-3.5 max-w-[620px] text-[16.5px] leading-[1.55] text-ink-2">
        Point Grove at a repo once. After that, spinning up a fresh, fully-set-up workspace takes seconds.
      </p>

      <div className="mt-10 flex flex-col">
        {STEPS.map((s) => (
          <div
            key={s.n}
            className="grid grid-cols-1 gap-6 border-t-[0.5px] border-black/[0.09] py-7 first:border-t-0 sm:grid-cols-[56px_1fr]"
          >
            <div className="tint flex h-11 w-11 items-center justify-center rounded-xl font-mono text-[15px] font-semibold text-grn-ink">
              {s.n}
            </div>
            <div>
              <h3 className="text-[20px] font-[630] -tracking-[0.4px]">{s.title}</h3>
              <p className="mt-2 max-w-[560px] text-[15px] leading-[1.6] text-ink-2">{s.body}</p>
              {s.term && <TerminalMock />}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
