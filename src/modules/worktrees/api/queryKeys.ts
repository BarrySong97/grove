/**
 * @purpose Defines TanStack Query keys for Rust-backed Worktrees data.
 * @role    Shared query key catalog used by hooks and mutations.
 * @deps    TypeScript only
 * @gotcha  Keys describe backend reads; UI-only Jotai atoms use separate storage keys.
 */
export const worktreeQueryKeys = {
  appSettings: ['worktrees', 'app-settings'] as const,
  projects: ['worktrees', 'projects'] as const
}
