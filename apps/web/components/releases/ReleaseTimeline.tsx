type Kind = 'new' | 'imp' | 'fix'
type Entry = { kind: Kind; items: { lead?: string; text: string }[] }
type Release = { ver: string; date: string; head: string; badge?: 'latest' | 'beta'; groups: Entry[] }

const RELEASES: Release[] = [
  {
    ver: '1.4', date: 'Jun 12, 2026', head: 'Agent workspaces & faster setup.', badge: 'latest',
    groups: [
      { kind: 'new', items: [
        { lead: 'Agent mode.', text: 'Spin up a batch of isolated worktrees for parallel coding agents in one action — each gets its own checkout and Setup run.' },
        { lead: 'Per-project script editor.', text: 'Edit your New, Setup, and Archive scripts inline, with live validation.' },
      ] },
      { kind: 'imp', items: [
        { text: 'Setup scripts now run in parallel across worktrees — bulk creation is up to 3× faster.' },
        { text: 'Git status badges refresh on file-system changes instead of polling.' },
      ] },
      { kind: 'fix', items: [{ text: 'Archived worktrees occasionally left a stale folder when a service was still running.' }] },
    ],
  },
  {
    ver: '1.3', date: 'May 2, 2026', head: 'Right-click actions everywhere.',
    groups: [
      { kind: 'new', items: [
        { text: 'Right-click menu on any branch — open in editor, terminal, or Finder, run a script, or archive.' },
        { lead: 'Custom editor & terminal.', text: 'Point Grove at VS Code, Cursor, iTerm, Ghostty, or any app.' },
      ] },
      { kind: 'imp', items: [
        { text: 'Projects can now be collapsed, with a live worktree count in the header.' },
        { text: 'Menu width and row density are now configurable.' },
      ] },
    ],
  },
  {
    ver: '1.2', date: 'Mar 18, 2026', head: 'Live git status badges.',
    groups: [
      { kind: 'new', items: [{ text: 'Status badges on every worktree — ahead, behind, dirty, and clean states at a glance.' }] },
      { kind: 'fix', items: [
        { text: 'Worktrees on external volumes no longer disappear from the list after sleep.' },
        { text: 'Apple silicon launch time reduced by ~40%.' },
      ] },
    ],
  },
  {
    ver: '1.1', date: 'Feb 1, 2026', head: 'Setup scripts arrive.',
    groups: [
      { kind: 'new', items: [{ lead: 'Lifecycle scripts.', text: 'Define New, Setup, and Archive per project — run automatically as worktrees come and go.' }] },
    ],
  },
  {
    ver: '1.0', date: 'Jan 9, 2026', head: 'Grove ships.',
    groups: [
      { kind: 'new', items: [
        { text: 'Manage git worktrees from the menu bar — grouped by project.' },
        { text: 'One-click switch between checkouts.' },
        { text: 'Create and remove worktrees without touching the terminal.' },
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
