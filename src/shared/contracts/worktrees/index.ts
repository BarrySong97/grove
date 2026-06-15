/**
 * @purpose Re-exports Worktrees shared contracts.
 * @role    Browser-safe contract barrel for frontend and future backend adapters.
 * @deps    ./worktree.contract
 * @gotcha  Keep this layer free of React, Tauri, filesystem, and mock repository imports.
 */
export * from './worktree.contract'
