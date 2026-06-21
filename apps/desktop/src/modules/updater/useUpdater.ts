/**
 * @purpose Drives the in-app update lifecycle (check, download, install, relaunch).
 * @role    Updater feature hook consumed by UpdateBadge; production-only, fails silent.
 * @deps    @tauri-apps/plugin-updater, @tauri-apps/plugin-process, React
 * @gotcha  Never throws to the UI — no release/offline/dev simply stays idle; docs/modules/updater/README.md
 */
import { relaunch } from '@tauri-apps/plugin-process'
import { check, type Update } from '@tauri-apps/plugin-updater'
import { useCallback, useEffect, useRef, useState } from 'react'

export type UpdaterStatus = 'idle' | 'available' | 'downloading' | 'installing' | 'error'

const CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000

export interface UpdaterState {
  status: UpdaterStatus
  version: string | null
  progress: number
  installAndRestart: () => void
}

export function useUpdater(): UpdaterState {
  const [status, setStatus] = useState<UpdaterStatus>('idle')
  const [version, setVersion] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const updateRef = useRef<Update | null>(null)
  const busyRef = useRef(false)

  const runCheck = useCallback(async () => {
    if (busyRef.current) return
    try {
      const update = await check()
      if (update) {
        updateRef.current = update
        setVersion(update.version)
        setStatus('available')
      }
    } catch {
      // No published release, offline, or running outside Tauri — stay idle.
    }
  }, [])

  useEffect(() => {
    if (!import.meta.env.PROD) return
    void runCheck()
    const id = window.setInterval(() => void runCheck(), CHECK_INTERVAL_MS)
    return () => window.clearInterval(id)
  }, [runCheck])

  const installAndRestart = useCallback(() => {
    const update = updateRef.current
    if (!update || busyRef.current) return
    busyRef.current = true

    void (async () => {
      try {
        setStatus('downloading')
        setProgress(0)
        let downloaded = 0
        let contentLength = 0
        await update.downloadAndInstall((event) => {
          switch (event.event) {
            case 'Started':
              contentLength = event.data.contentLength ?? 0
              break
            case 'Progress':
              downloaded += event.data.chunkLength
              setProgress(
                contentLength ? Math.min(100, Math.round((downloaded / contentLength) * 100)) : 0
              )
              break
            case 'Finished':
              setProgress(100)
              break
          }
        })
        setStatus('installing')
        await relaunch()
      } catch {
        busyRef.current = false
        setStatus('error')
      }
    })()
  }, [])

  return { status, version, progress, installAndRestart }
}
