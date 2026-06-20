/** Faux macOS terminal window showing the commands Grove runs for you. */
export function TerminalMock() {
  return (
    <div className="mt-4 max-w-[560px] overflow-hidden rounded-xl border-[0.5px] border-black/[0.09] bg-[#14161c] shadow-float">
      <div className="flex items-center gap-[7px] border-b-[0.5px] border-white/[0.07] px-3.5 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
      </div>
      <div className="px-[17px] py-[15px] font-mono text-[13px] leading-[1.7] text-[#c9d1d9]">
        <div className="text-ink-3"># Grove runs this for you</div>
        <div>
          <span className="text-grn-bright">$</span> git worktree add ../feat-checkout feat/checkout
        </div>
        <div>
          <span className="text-grn-bright">$</span> npm install &amp;&amp; cp ../.env .env
        </div>
        <div>
          <span className="text-grn-bright">✓</span> worktree ready · 4.2s
        </div>
      </div>
    </div>
  )
}
