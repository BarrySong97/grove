/**
 * @purpose Re-exports the public Worktrees module surface.
 * @role    Feature module barrel consumed by the app shell.
 * @deps    ./components/WorktreePanel
 * @gotcha  Keep exports narrow so app does not depend on internals; docs/modules/worktrees/README.md
 */
export * from './components/WorktreePanel'
