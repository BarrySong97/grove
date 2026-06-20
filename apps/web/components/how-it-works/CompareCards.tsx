const WITHOUT = [
  'Stash or commit half-done work just to check out another branch',
  'A hotfix blows away the feature you were mid-flow on',
  'Re-run install & build every time you switch',
  'Agents fighting over the same files',
]

const WITH = [
  'Each branch lives in its own directory — nothing to stash',
  'Jump between checkouts instantly from the menu bar',
  'Setup scripts run once, per worktree',
  'Give every agent its own isolated checkout',
]

export function CompareCards() {
  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
      <div className="card p-7">
        <div className="font-mono text-[12px] font-semibold tracking-[0.4px] text-[#c2603f]">WITHOUT GROVE</div>
        <h3 className="mt-3 text-[19px] font-[640] -tracking-[0.3px]">One working copy, constant context-switching</h3>
        <ul className="mt-4 flex flex-col gap-3">
          {WITHOUT.map((t) => (
            <li key={t} className="flex gap-3 text-[14.5px] leading-[1.5] text-ink-2">
              <span className="mt-px font-mono text-[#c2603f]">×</span>
              {t}
            </li>
          ))}
        </ul>
      </div>
      <div className="card p-7">
        <div className="font-mono text-[12px] font-semibold tracking-[0.4px] text-grn-ink">WITH GROVE</div>
        <h3 className="mt-3 text-[19px] font-[640] -tracking-[0.3px]">Every branch is a real, ready folder</h3>
        <ul className="mt-4 flex flex-col gap-3">
          {WITH.map((t) => (
            <li key={t} className="flex gap-3 text-[14.5px] leading-[1.5] text-ink-2">
              <span className="mt-px font-mono text-grn">✓</span>
              {t}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
