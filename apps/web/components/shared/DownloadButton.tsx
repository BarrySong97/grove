'use client'

import { Button } from '@heroui/react/button'
import { Download } from '@/lib/icons'
import { SITE } from '@/lib/site'

/** Primary "Download for macOS" CTA — links to the latest macOS release. */
export function DownloadButton({
  size = 'lg',
  href = SITE.downloadUrl,
}: {
  size?: 'sm' | 'lg'
  href?: string
}) {
  const lg = size === 'lg'
  return (
    <Button
      variant="primary"
      size={lg ? 'lg' : 'sm'}
      onPress={() => window.open(href, '_blank', 'noopener,noreferrer')}
      className={
        'h-auto cursor-pointer gap-2 border-[0.5px] border-transparent font-semibold -tracking-[0.1px] text-white shadow-[0_1px_2px_rgba(0,0,0,0.10)] transition ' +
        'bg-[var(--grn)] hover:-translate-y-px hover:bg-[var(--grn-deep)] hover:shadow-[0_8px_22px_color-mix(in_srgb,var(--grn-deep)_22%,transparent)] ' +
        (lg ? 'rounded-[11px] px-6 py-[13px] text-[15.5px]' : 'rounded-[9px] px-4 py-[9px] text-sm')
      }
    >
      <Download {...(lg ? {} : { width: 15, height: 15 })} /> Download for macOS
    </Button>
  )
}
