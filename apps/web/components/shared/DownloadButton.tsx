import { Download } from '@/lib/icons'

/** Primary "Download for macOS" call-to-action. Uses .btn (already cursor-pointer). */
export function DownloadButton({ size = 'lg' }: { size?: 'sm' | 'lg' }) {
  return (
    <a href="#" className={'btn btn-grn' + (size === 'lg' ? ' btn-lg' : '')}>
      <Download {...(size === 'sm' ? { width: 15, height: 15 } : {})} /> Download for macOS
    </a>
  )
}
