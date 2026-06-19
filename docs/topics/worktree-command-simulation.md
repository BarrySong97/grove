# Worktree Operation Workflow Boundary

Grove no longer treats worktree create/archive/setup as frontend simulation. The frontend may hold UI state such as sorting, collapse state, open sheets, toasts, and the currently selected row, but git, shell, persistence, logs, retry, archive, and project removal are backend-owned workflows.

## Backend-Owned Behavior

- `create_workspace` runs real `git worktree add`, copies matching ignored files, and optionally runs setup.
- `archive_workspace` protects the repo root workspace, runs archive command for valid worktrees, and then hides or removes the git worktree according to project/global policy. Missing, stale, or damaged workspaces are hidden from Grove and pruned without running workspace commands.
- `retry_workspace_operation` retries failed setup/create or archive operations; setup retry does not repeat `git worktree add`.
- `remove_project` removes Grove project records and may optionally archive/remove clean managed active worktrees. It skips missing/damaged entries and never deletes the main repository root or scans arbitrary workspace root contents.
- `refresh_project` synchronizes Grove state with `git worktree list --porcelain` and git status snapshots, including the repo root and marking missing active rows stale.
- Operation logs are read through backend commands, not by direct frontend filesystem access.
- TanStack Query may orchestrate frontend reads and mutations for backend data, but its cache is not authoritative project/workspace state.

## Frontend-Owned Behavior

- Project and worktree ordering in the panel, persisted as Jotai UI preference atoms.
- Current settings/open/log/confirmation sheet state.
- Collapsed project ids, persisted as a Jotai UI preference atom.
- Toasts and short-lived progress feedback.
- Toast close controls and non-progress auto-dismiss timing.
- Empty-state links and click routing.

## Removed Prototype Behavior

- There is no user-facing Run Command action.
- Project command settings only include setup and archive.
- The frontend does not fake setup/archive completion with timers.
- `window.confirm` is not used for archive policy choices; Grove confirmation sheets own that UI.

## Safety Requirements

- Mutating operations must enforce project/workspace operation locks in Rust.
- Destructive worktree removal must reject dirty workspaces before deleting directories.
- Repo root workspaces must be protected in Rust even if a frontend action is accidentally exposed.
- Missing, stale, or damaged workspace cleanup may hide Grove records but must not delete arbitrary directories.
- Remove Project's destructive mode must preflight active managed workspaces before running archive commands or deleting any worktree, while skipping the repo root.
- UI disabled states are only a usability layer and must not be the only protection.
