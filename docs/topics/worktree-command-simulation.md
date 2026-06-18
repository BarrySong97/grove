# Worktree Operation Workflow Boundary

Grove no longer treats worktree create/archive/setup as frontend simulation. The frontend may hold transient UI state such as sorting, collapse state, open sheets, toasts, and the currently selected row, but git, shell, persistence, logs, retry, archive, and project removal are backend-owned workflows.

## Backend-Owned Behavior

- `create_workspace` runs real `git worktree add`, copies matching ignored files, and optionally runs setup.
- `archive_workspace` runs archive command and then hides or removes the git worktree according to project/global policy.
- `retry_workspace_operation` retries failed setup/create or archive operations; setup retry does not repeat `git worktree add`.
- `remove_project` removes Grove project records and may optionally archive/remove all clean managed active worktrees. It never deletes the main repository root and never scans arbitrary workspace root contents.
- `refresh_project` synchronizes Grove state with `git worktree list --porcelain` and git status snapshots.
- Operation logs are read through backend commands, not by direct frontend filesystem access.

## Frontend-Owned Behavior

- Project and worktree ordering in the panel.
- Current settings/open/log/confirmation sheet state.
- Collapsed project ids in `localStorage`.
- Toasts and short-lived progress feedback.
- Empty-state links and click routing.

## Removed Prototype Behavior

- There is no user-facing Run Command action.
- Project command settings only include setup and archive.
- The frontend does not fake setup/archive completion with timers.
- `window.confirm` is not used for archive policy choices; Grove confirmation sheets own that UI.

## Safety Requirements

- Mutating operations must enforce project/workspace operation locks in Rust.
- Destructive worktree removal must reject dirty workspaces before deleting directories.
- Remove Project's destructive mode must preflight all active managed workspaces before running archive commands or deleting any worktree.
- UI disabled states are only a usability layer and must not be the only protection.
