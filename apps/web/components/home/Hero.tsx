import { GlowBackdrop } from '@/components/shared/GlowBackdrop'
import { DownloadButton } from '@/components/shared/DownloadButton'
import { GhostButton } from '@/components/shared/GhostButton'
import { AppPreview } from './AppPreview'

export function Hero() {
  return (
    <header className="relative pb-9 pt-[86px]">
      <GlowBackdrop variant="hero" className="h-[720px]" />
      <div className="mx-auto grid max-w-[1140px] grid-cols-1 items-center gap-8 px-8 md:grid-cols-2">
        <div>
          <span className="pill">
            <span className="h-1.5 w-1.5 rounded-full bg-grn shadow-[0_0_7px_var(--grn)]" /> macOS menu-bar app
          </span>
          <h1 className="mt-[22px] text-[clamp(38px,6vw,56px)] font-[680] leading-[1.04] -tracking-[1.8px] text-balance">
            Every branch gets its own <span className="text-grn-ink">workspace.</span>
          </h1>
          <p className="mt-5 max-w-[480px] text-[18px] leading-[1.55] text-ink-2 text-pretty">
            Grove turns git worktrees into one-click workspaces. Spin up an isolated checkout for every feature, fix, or{' '}
            <b className="font-semibold text-ink">AI agent</b> — then switch between them from your menu bar, with setup scripts that just run.
          </p>
          <div className="mt-[30px] flex flex-wrap items-center gap-3">
            <DownloadButton size="lg" />
            <GhostButton href="#">View on GitHub</GhostButton>
          </div>
          <div className="mt-[18px] flex items-center gap-3.5 font-mono text-[12.5px] text-ink-3">
            <span>Apple silicon &amp; Intel</span>
            <span>·</span>
            <span>git worktree, made simple</span>
          </div>
        </div>

        {/* product mock */}
        <div className="flex justify-center py-12 md:justify-end">
          <AppPreview />
        </div>
      </div>
    </header>
  )
}
