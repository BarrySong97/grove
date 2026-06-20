// Display-only fake data shaped after the desktop app's Project/Worktree model.
// No Tauri, no real git.

export type WorktreeStatus = 'ready' | 'setting-up' | 'archiving' | 'failed'

export type Worktree = {
  id: string
  branch: string
  base: string | null
  status: WorktreeStatus
  time: string
  message: string
}

export type Project = {
  id: string
  name: string
  path: string
  accent: string
  worktrees: Worktree[]
}

export const PROJECTS: Project[] = [
  {
    id: 'acme-web',
    name: 'acme-web',
    path: '~/code/acme-web',
    accent: '#3b82f6',
    worktrees: [
      { id: 'a1', branch: 'main', base: null, status: 'ready', time: 'now', message: 'chore: bump deps' },
      { id: 'a2', branch: 'feat/checkout-redesign', base: 'main', status: 'ready', time: '12m', message: 'add payment step' },
      { id: 'a3', branch: 'fix/payment-webhook', base: 'main', status: 'ready', time: '1h', message: 'retry on 5xx' },
      { id: 'a4', branch: 'chore/upgrade-vite', base: 'main', status: 'ready', time: '2h', message: 'migrate to vite 7' },
    ],
  },
  {
    id: 'design-system',
    name: 'design-system',
    path: '~/code/design-system',
    accent: '#a855f7',
    worktrees: [
      { id: 'd1', branch: 'main', base: null, status: 'ready', time: '3h', message: 'release v2.1' },
      { id: 'd2', branch: 'feat/color-tokens', base: 'main', status: 'setting-up', time: '1d', message: '' },
    ],
  },
]
