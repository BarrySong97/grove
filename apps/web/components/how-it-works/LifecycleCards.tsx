const LIFECYCLE = [
  { tag: 'New', dim: false, title: 'Post-create hook', body: 'Fires the instant a worktree is created — seed config, link shared caches, whatever the branch needs to exist.', when: 'runs once · on create' },
  { tag: 'Setup', dim: false, title: 'Install deps & env', body: 'Installs dependencies and environment so the checkout builds and runs the first time you open it.', when: 'runs once · after New' },
  { tag: 'Archive', dim: true, title: 'Cleanup on remove', body: 'Tears everything down cleanly when you’re done — stop services, drop volumes, then remove the folder.', when: 'runs once · on archive' },
]

export function LifecycleCards() {
  return (
    <div className="mt-[76px]">
      <h2 className="text-[32px] font-[660] leading-[1.12] -tracking-[0.9px] text-balance">
        Three scripts run your setup automatically
      </h2>
      <p className="mt-3.5 max-w-[620px] text-[16.5px] leading-[1.55] text-ink-2">
        Define them once per project. Grove runs each at the right moment in a worktree’s life, so a fresh branch is always ready to work in — and a removed one leaves nothing behind.
      </p>

      <div className="mt-[38px] grid grid-cols-1 gap-[18px] md:grid-cols-3">
        {LIFECYCLE.map((l) => (
          <div key={l.tag} className="card p-6">
            <span
              className={
                'inline-block rounded-md px-2.5 py-[3px] font-mono text-[12px] font-semibold text-white ' +
                (l.dim ? 'bg-black/[0.78]' : '')
              }
              style={l.dim ? undefined : { background: 'var(--grn)' }}
            >
              {l.tag}
            </span>
            <h3 className="mt-[15px] text-[16.5px] font-[620] -tracking-[0.3px]">{l.title}</h3>
            <p className="mt-2 text-sm leading-[1.55] text-ink-2">{l.body}</p>
            <div className="mt-3.5 font-mono text-[12px] text-ink-3">{l.when}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
