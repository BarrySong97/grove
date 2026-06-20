import type { ReactNode } from 'react'
import { Branch, Script, Pulse, Agents, Folder, Archive } from '@/lib/icons'
import { GhostButton } from '@/components/shared/GhostButton'
import { FeatureCard } from './FeatureCard'

const FEATURES: { icon: ReactNode; title: string; body: string }[] = [
  { icon: <Branch />, title: 'Switch in one click', body: 'Every worktree is a real folder. Click to make it current; open it in your editor, terminal, or Finder without leaving the menu.' },
  { icon: <Script />, title: 'Setup that just runs', body: 'New, Setup, and Archive lifecycle hooks install dependencies and environment automatically the moment a worktree is born.' },
  { icon: <Pulse />, title: 'Git status at a glance', body: 'Live ahead / behind / dirty / clean badges on every branch, so you always know what’s safe to switch away from.' },
  { icon: <Agents />, title: 'Built for parallel agents', body: 'Give every AI coding agent its own isolated checkout. They run side by side without stepping on each other’s files.' },
  { icon: <Folder />, title: 'Organized by project', body: 'Worktrees nest under the project they belong to. Collapse a project, see the count, jump straight to the branch you need.' },
  { icon: <Archive />, title: 'Clean teardown', body: 'Archive a worktree and Grove runs your cleanup script, then removes the folder — no orphaned branches or stray directories.' },
]

export function FeatureGrid() {
  return (
    <section className="py-[92px]">
      <div className="mx-auto max-w-[1140px] px-8">
        <span className="eyebrow">Features</span>
        <h2 className="mt-3.5 text-[36px] font-[660] leading-[1.1] -tracking-[1px] text-balance">
          Built for working many branches at once.
        </h2>
        <p className="mt-4 max-w-[600px] text-[17px] leading-[1.55] text-ink-2 text-pretty">
          No more stashing, no more branch-switch churn, no more half-finished work clobbered by a hotfix. Each branch lives in its own real directory.
        </p>

        <div className="mt-[54px] grid grid-cols-1 gap-5 md:grid-cols-3">
          {FEATURES.map((f) => (
            <FeatureCard key={f.title} icon={f.icon} title={f.title} body={f.body} />
          ))}
        </div>

        <div className="mt-14 flex flex-wrap items-center gap-3.5">
          <GhostButton route="how">See how it works</GhostButton>
          <GhostButton route="releases">What’s new</GhostButton>
        </div>
      </div>
    </section>
  )
}
