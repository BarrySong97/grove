type Kind = 'new' | 'imp' | 'fix'
type Entry = { kind: Kind; items: { lead?: string; text: string }[] }
type Release = { ver: string; date: string; head: string; badge?: 'latest' | 'beta'; groups: Entry[] }

const RELEASES: Release[] = [
  {
    ver: '0.2.2', date: 'Jun 22, 2026', head: 'Worktree branches stay in sync.', badge: 'latest',
    groups: [
      { kind: 'fix', items: [
        { lead: 'Live branch & git status.', text: 'Grove now refreshes each worktree’s real git branch and status when you open the panel or expand a project — a branch you switched outside Grove (git switch) shows up correctly instead of the one from when the worktree was created.' },
      ] },
    ],
  },
  {
    ver: '0.2.1', date: 'Jun 22, 2026', head: 'Check for updates without relaunching.',
    groups: [
      { kind: 'new', items: [
        { lead: 'Check for updates in Settings.', text: 'A new Settings → Updates section lets you check for the latest Grove and install it on the spot — no need to quit and reopen the app.' },
      ] },
    ],
  },
  {
    ver: '0.2.0', date: 'Jun 22, 2026', head: 'Smoother first launch, more reliable Ghostty.',
    groups: [
      { kind: 'new', items: [
        { lead: 'Guided first launch.', text: 'The first time you open Grove, Settings opens automatically so you can choose which apps appear as one-click quick-open buttons.' },
      ] },
      { kind: 'imp', items: [
        { lead: 'Ghostty opens reliably.', text: 'Opening a workspace in Ghostty now always lands in your current Ghostty window at the right directory. The separate window/tab preference was removed — on macOS a new window per workspace couldn’t be opened dependably.' },
      ] },
    ],
  },
  {
    ver: '0.1.0', date: 'Jun 21, 2026', head: 'Grove’s first preview.',
    groups: [
      { kind: 'new', items: [
        { lead: 'Worktrees in your menu bar.', text: 'Manage git worktrees grouped by project, and switch between checkouts in one click — no terminal required.' },
        { lead: 'Create & archive instantly.', text: 'Spin up an isolated worktree for any feature, fix, or AI agent, then archive it when you’re done.' },
        { lead: 'Setup scripts.', text: 'Define a per-project Setup script that runs automatically as each worktree is created.' },
        { lead: 'Open anywhere.', text: 'Open a worktree in your editor, terminal, or Finder — point Grove at VS Code, Cursor, iTerm, Ghostty, or any app.' },
        { text: 'Universal macOS build for Apple silicon & Intel, with in-app updates and Homebrew install.' },
      ] },
    ],
  },
]

const LABELS: Record<Kind, { text: string; cls: string; pip: string }> = {
  new: { text: 'NEW', cls: 'text-grn-ink', pip: 'var(--grn)' },
  imp: { text: 'IMPROVED', cls: 'text-[#3f4fd6]', pip: '#5b6ef5' },
  fix: { text: 'FIXED', cls: 'text-[#c2603f]', pip: '#c2603f' },
}

export function ReleaseTimeline() {
  return (
    <main className="pb-[92px] pt-1.5">
      <div className="mx-auto max-w-[820px] px-8">
        {RELEASES.map((r) => (
          <article
            key={r.ver}
            className="grid grid-cols-1 gap-10 border-t-[0.5px] border-black/[0.09] py-11 first:border-t-0 md:grid-cols-[200px_1fr]"
          >
            <div className="self-start md:sticky md:top-[86px]">
              <div className="flex items-center gap-2.5">
                <span className="text-[24px] font-[680] -tracking-[0.6px]">{r.ver}</span>
                {r.badge === 'latest' && (
                  <span className="tint rounded-full px-2 py-[3px] font-mono text-[10.5px] font-semibold uppercase tracking-[0.4px] text-grn-ink">
                    Latest
                  </span>
                )}
                {r.badge === 'beta' && (
                  <span className="rounded-full border-[0.5px] border-amber-500/30 bg-amber-400/[0.14] px-2 py-[3px] font-mono text-[10.5px] font-semibold uppercase tracking-[0.4px] text-[#8a6d1f]">
                    Beta
                  </span>
                )}
              </div>
              <div className="mt-2 font-mono text-[13.5px] text-ink-3">{r.date}</div>
              <div className="mt-3.5 max-w-[180px] text-[15px] leading-[1.5] text-ink-2">{r.head}</div>
            </div>

            <div>
              {r.groups.map((g, gi) => (
                <div key={g.kind} className={gi > 0 ? 'mt-[22px]' : ''}>
                  <span
                    className={
                      'inline-flex items-center gap-2 font-mono text-[12px] font-semibold tracking-[0.3px] ' +
                      LABELS[g.kind].cls
                    }
                  >
                    <span className="h-[7px] w-[7px] rounded-[2px]" style={{ background: LABELS[g.kind].pip }} />
                    {LABELS[g.kind].text}
                  </span>
                  <ul className="mt-3 flex flex-col gap-2.5">
                    {g.items.map((it, i) => (
                      <li key={i} className="flex gap-3 text-[15px] leading-[1.55] text-ink">
                        <span className="mt-[9px] h-[5px] w-[5px] flex-none rounded-full bg-black/[0.14]" />
                        <span>
                          {it.lead && <b className="font-semibold">{it.lead} </b>}
                          <span className="text-ink-2">{it.text}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    </main>
  )
}
