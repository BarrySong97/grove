import { Archive, Check, FolderGit2, GitBranch } from 'lucide-react'
import type { ReactNode } from 'react'

/* ------------------------------------------------------------------ *
 * Placeholder sketches — simple HTML mocks of each idea. Swap each one
 * for a real illustration later; the <SketchFrame> keeps a fixed 4:3
 * frame so an <img> drops straight in.
 * ------------------------------------------------------------------ */

function SketchFrame({ children }: { children: ReactNode }) {
  return (
    <div
      className="flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-2xl border border-dashed border-black/[0.13] p-7"
      style={{ background: 'color-mix(in srgb, var(--grn) 5%, transparent)' }}
    >
      {children}
    </div>
  )
}

function AgentsSketch() {
  const lanes = [
    { branch: 'feat/checkout', path: '~/app.worktrees/feat-checkout', color: '#4f6f8f' },
    { branch: 'fix/webhook', path: '~/app.worktrees/fix-webhook', color: '#6f8b5f' },
    { branch: 'agent/refactor', path: '~/app.worktrees/agent-refactor', color: '#8f6f4f' },
  ]
  return (
    <div className="w-full max-w-[280px] space-y-2.5">
      {lanes.map((lane) => (
        <div
          key={lane.branch}
          className="flex items-center gap-2.5 rounded-lg border-[0.5px] border-black/[0.08] bg-panel px-3 py-2 shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
        >
          <FolderGit2 size={15} strokeWidth={1.8} className="shrink-0" style={{ color: lane.color }} />
          <div className="min-w-0 leading-tight">
            <div className="font-mono text-[12px] text-ink-2">{lane.branch}</div>
            <div className="truncate font-mono text-[9.5px] text-ink-3">{lane.path}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

function SetupSketch() {
  return (
    <div className="w-full max-w-[280px] overflow-hidden rounded-xl border-[0.5px] border-black/10 bg-[#1c1f24] shadow-[0_8px_22px_rgba(0,0,0,0.18)]">
      <div className="flex items-center gap-1.5 border-b border-white/[0.08] px-3 py-2">
        <span className="h-2 w-2 rounded-full bg-white/25" />
        <span className="h-2 w-2 rounded-full bg-white/20" />
        <span className="h-2 w-2 rounded-full bg-white/15" />
      </div>
      <div className="space-y-1.5 p-3.5 font-mono text-[11.5px] leading-relaxed">
        <div className="text-white/75">$ ./setup.sh</div>
        <div className="text-white/35">… syncing .env · installing deps</div>
        <div className="flex items-center gap-1.5 text-emerald-300/85">
          <Check size={12} strokeWidth={2.4} /> ready in 4.2s
        </div>
      </div>
    </div>
  )
}

function ArchiveSketch() {
  return (
    <div className="w-full max-w-[280px] space-y-2.5">
      <div className="flex items-center gap-2.5 rounded-lg border-[0.5px] border-black/[0.08] bg-panel px-3 py-2 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <GitBranch size={14} className="shrink-0 text-ink-3" />
        <span className="font-mono text-[12px] text-ink-2">main</span>
        <span className="ml-auto font-mono text-[10.5px] uppercase tracking-[1px] text-ink-3">
          untouched
        </span>
      </div>
      <div className="flex items-center gap-2.5 rounded-lg border border-dashed border-black/[0.14] px-3 py-2 opacity-60">
        <Archive size={13} className="shrink-0 text-ink-3" />
        <span className="font-mono text-[12px] text-ink-3 line-through">feat/checkout</span>
        <span className="ml-auto font-mono text-[10.5px] uppercase tracking-[1px] text-ink-3">
          archived
        </span>
      </div>
    </div>
  )
}

type Feature = { eyebrow: string; title: string; body: string; sketch: ReactNode }

const FEATURES: Feature[] = [
  {
    eyebrow: 'Isolation',
    title: 'One checkout per agent',
    body: 'Every branch — and every AI agent — gets its own isolated checkout. Run a whole fleet in parallel without them clobbering each other’s files.',
    sketch: <AgentsSketch />,
  },
  {
    eyebrow: 'Setup',
    title: 'Set up on create',
    body: 'Point Grove at a setup script and it runs the moment a worktree is created — env vars, config, and dependencies ready before you open it.',
    sketch: <SetupSketch />,
  },
  {
    eyebrow: 'Cleanup',
    title: 'Clean on archive',
    body: 'Done with the work? Archive the worktree and Grove tears it down cleanly. Your main checkout is never touched.',
    sketch: <ArchiveSketch />,
  },
]

/** Three core ideas as alternating image/text rows. */
export function Features() {
  return (
    <section className="mx-auto max-w-[1140px] px-8 pt-[110px]">
      <h2 className="max-w-[520px] text-[clamp(26px,3.2vw,34px)] font-[670] leading-[1.1] -tracking-[0.8px] text-balance">
        Powerful worktrees, none of the chore.
      </h2>

      <div className="mt-14 space-y-16 lg:space-y-24">
        {FEATURES.map((feature, index) => {
          const reverse = index % 2 === 1
          return (
            <div
              key={feature.title}
              className="grid items-center gap-x-14 gap-y-7 lg:grid-cols-2"
            >
              <div className={reverse ? 'lg:order-2' : ''}>
                <SketchFrame>{feature.sketch}</SketchFrame>
              </div>
              <div className={reverse ? 'lg:order-1' : 'lg:justify-self-end'}>
                <div className="max-w-[440px]">
                  <span className="font-mono text-[12px] font-semibold uppercase tracking-[1.5px] text-grn-ink">
                    {feature.eyebrow}
                  </span>
                  <h3 className="mt-3 text-[clamp(22px,2.6vw,28px)] font-[660] -tracking-[0.5px] text-balance">
                    {feature.title}
                  </h3>
                  <p className="mt-3 text-[16px] leading-[1.58] text-ink-2 text-pretty">
                    {feature.body}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
