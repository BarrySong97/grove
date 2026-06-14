import { useEffect } from 'react'
import { WorktreePanel } from '../modules/worktrees'
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
    <main className="app-shell h-screen w-screen bg-transparent p-0 font-sans text-[#1c1c1e]">
      <WorktreePanel onQuit={() => invokeQuietly('quit_app')} />
    </main>
  )
}
