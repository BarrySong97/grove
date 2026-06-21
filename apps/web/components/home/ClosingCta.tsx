import { DownloadButton } from '@/components/shared/DownloadButton'
import { GhostButton } from '@/components/shared/GhostButton'
import { BrewCommand } from '@/components/shared/BrewCommand'
import { SITE } from '@/lib/site'

/** Final download band — the strongest-intent readers reach the bottom; close them here. */
export function ClosingCta() {
  return (
    <section className="mx-auto max-w-[1140px] px-8 pt-[120px]">
      <div className="card relative overflow-hidden px-8 py-16 text-center sm:py-20">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 -top-1/3 h-[140%] opacity-70"
          style={{
            background:
              'radial-gradient(60% 60% at 50% 0%, color-mix(in srgb, var(--grn) 16%, transparent), transparent 70%)',
          }}
        />
        <div className="relative">
          <span className="pill">
            <span className="h-1.5 w-1.5 rounded-full bg-grn shadow-[0_0_7px_var(--grn)]" /> macOS
            menu-bar app
          </span>
          <h2 className="mx-auto mt-6 max-w-[560px] text-[clamp(28px,3.6vw,40px)] font-[670] leading-[1.07] -tracking-[1px] text-balance">
            Give every branch its own <span className="text-grn-ink">workspace.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-[420px] text-[16.5px] leading-[1.55] text-ink-2 text-pretty">
            Add a repo and spin up your first ready-to-go worktree in under a minute.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <DownloadButton size="lg" />
            <GhostButton href={SITE.githubUrl}>View on GitHub</GhostButton>
          </div>
          <div className="mt-3.5 flex justify-center">
            <BrewCommand />
          </div>
          <div className="mt-[18px] flex items-center justify-center gap-3.5 font-mono text-[12.5px] text-ink-3">
            <span>Apple silicon &amp; Intel</span>
            <span>·</span>
            <span>free while in preview</span>
          </div>
        </div>
      </div>
    </section>
  )
}
