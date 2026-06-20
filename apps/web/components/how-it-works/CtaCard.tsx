import { DownloadButton } from '@/components/shared/DownloadButton'
import { GhostButton } from '@/components/shared/GhostButton'

export function CtaCard() {
  return (
    <div className="card mt-16 flex flex-wrap items-center gap-3.5 p-8 shadow-float">
      <div className="min-w-[240px] flex-1">
        <h3 className="text-[21px] font-[650] -tracking-[0.4px]">Ready to work in parallel?</h3>
        <p className="mt-1.5 text-[15px] text-ink-2">Free, native, and quietly waiting in your menu bar.</p>
      </div>
      <DownloadButton size="lg" />
      <GhostButton route="releases">See what’s new</GhostButton>
    </div>
  )
}
