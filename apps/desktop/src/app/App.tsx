/**
 * @purpose Mounts the Grove React shell and wires global panel keyboard actions.
 * @role    Application composition layer; renders WorktreePanel and invokes Tauri hide/quit commands.
 * @deps    React, @tanstack/react-query, src/modules/worktrees, src/app/queryClient.ts, src/app/tauriCommands.ts
 * @gotcha  Keep global Escape behavior compatible with focused editors; docs/modules/app/README.md
 */
import { QueryClientProvider } from '@tanstack/react-query'
import { useEffect } from 'react'
import { UpdateBadge } from '../modules/updater'
import { WorktreePanel } from '../modules/worktrees'
import '../shared/i18n/i18n'
import { queryClient } from './queryClient'
import { invokeQuietly } from './tauriCommands'

export default function App() {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') invokeQuietly('hide_panel')
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <main className="app-shell relative h-screen w-screen bg-transparent p-0 font-sans text-[#1c1c1e]">
        <WorktreePanel onQuit={() => invokeQuietly('quit_app')} />
        <UpdateBadge />
      </main>
    </QueryClientProvider>
  )
}
