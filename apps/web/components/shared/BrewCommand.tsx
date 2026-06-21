'use client'

import { useState } from 'react'
import { SITE } from '@/lib/site'
import { Check, Copy } from '@/lib/icons'

/** Copyable Homebrew install command — click to copy. */
export function BrewCommand({ className = '' }: { className?: string }) {
  const [copied, setCopied] = useState(false)

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(SITE.brewCommand)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      // Clipboard unavailable (e.g. insecure context) — ignore silently.
    }
  }

  return (
    <button
      type="button"
      onClick={onCopy}
      aria-label="Copy Homebrew install command"
      className={
        'group inline-flex max-w-full items-center gap-3 rounded-[10px] border-[0.5px] border-black/[0.12] bg-white/70 px-3.5 py-2.5 font-mono text-[13px] transition hover:border-black/20 hover:bg-white ' +
        className
      }
    >
      <span className="select-none text-grn-ink">$</span>
      <span className="truncate text-ink">{SITE.brewCommand}</span>
      <span className="ml-1 shrink-0 text-ink-3 transition group-hover:text-ink-2">
        {copied ? <Check /> : <Copy />}
      </span>
    </button>
  )
}
