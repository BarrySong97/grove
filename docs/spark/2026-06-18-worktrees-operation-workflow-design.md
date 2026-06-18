# Worktrees Operation Workflow Design

## Context

Grove is a macOS menu bar manager for Conductor-style git worktree projects. The backend now covers SQLite persistence, Conductor import, manual project registration, real `git worktree add/remove`, setup/archive command execution, native openers, and operation records. The remaining foundation work is to make those workflows coherent and recoverable across UI, backend operations, settings, logs, retry, deletion, and tests.

This design intentionally stays inside Grove's project/workspace management scope. It does not add Conductor agent chat, pull request, review, task orchestration, cancellation of running commands, or app-exit process supervision.

## Goals

- Replace ad hoc frontend command simulation with a backend-owned operation model.
- Remove the user-facing Run Command workflow. Grove only runs setup during workspace creation and archive during workspace archive/removal.
- Make create, setup, archive, remove project, refresh, logs, failed state, and retry behavior consistent.
- Restore the empty-project onboarding path with both Conductor import and manual Add Project.
- Support global defaults plus project overrides for archive behavior.
- Add a configurable Remove Project behavior, with the destructive action launched only from Project Settings.
- Make multi-workspace project removal explicit and testable.
- Add focused Rust and frontend tests for the new behavior.

## Non-Goals

- No cancellation button for currently running commands.
- No background job runner that keeps managing commands after app exit.
- No deletion of a project's main repository directory.
- No scanning arbitrary workspace root directories for deletion candidates.
- No new global Grove workspace root setting. Workspace locations remain project-level and default to Conductor-compatible paths.

## User-Facing Behavior

### Empty Project List

When the project list is empty, the panel body shows two lines:

1. `Import from Conductor or Add Project`
   - `Import from Conductor` calls the existing Conductor import command.
   - `Add Project` opens the native folder picker and registers the selected git repository.
2. `How it works`
   - Opens a fixed external link for now, for example `https://example.com/grove-worktrees`.
   - The URL is intentionally easy to replace when real documentation exists.

The top header `Add project...` remains the manual folder picker. Conductor import is not hidden behind that header button.

### Worktree Actions

The worktree action sheet removes the Run Command section entirely. It keeps:

- Open actions.
- Copy Worktree Path.
- Archive Worktree.
- Failed-operation actions when applicable: View Log and Retry.

Setup and archive command strings remain editable, but they are only invoked by backend workflows:

- `setup`: after `create_workspace` creates/copies a new worktree.
- `archive`: before `archive_workspace` hides or removes a worktree, and before destructive project removal removes managed worktrees.

### Global Settings

Global Settings keeps the existing default open target and Ghostty open mode controls.

It adds `Default archive workspace behavior`:

- Ask every time.
- Hide in Grove only.
- Delete git worktree directory when safe.

It also adds `Remove project behavior`:

- Only remove from Grove.
- Also delete managed git worktrees when safe.

Global Settings only configures Remove Project behavior. It does not execute project removal.

### Project Settings

Project Settings keeps:

- Workspace root.
- Setup command.
- Archive command.

Project archive behavior becomes a project override with these choices:

- Use global default.
- Ask every time.
- Hide in Grove only.
- Delete git worktree directory when safe.

Project Settings adds `Remove Project...`. This is the only UI entry point that removes a project.

The confirmation sheet must state:

- The main repository directory is never deleted.
- Grove project/workspace records will be removed.
- If Global Settings allows deleting managed worktrees, Grove will only delete managed clean worktrees.
- Dirty worktrees block the destructive removal path.

## Backend Workflow

### Operation Model

Backend mutating workflows are represented as operations:

- `create_workspace`
- `setup_workspace` for retrying setup after a partial create failure
- `archive_workspace`
- `remove_project`
- `refresh_project` may either write a light operation record or return the same error/log shape without being treated as destructive

`import_conductor_projects` remains read-only. It should still use the same frontend progress/error display pattern.

The existing `operations` table remains the source for operation status metadata. It should support querying the latest operation for a project/workspace and reading or opening operation logs through backend commands. The frontend must not directly access filesystem log paths.

### Concurrency Locks

Locks are enforced by the backend. Frontend disabled states are only a UX layer.

- A running mutating workspace operation blocks another mutating operation on the same workspace.
- A running `remove_project` blocks create, archive, refresh, retry, and remove operations for the same project.
- Operations on different projects may proceed independently.
- Failed operations do not block retry.

### Workspace Location

Workspace location remains project-level:

- Manual Add Project defaults to Conductor-compatible workspace root plus project name.
- Conductor import uses the discovered project workspace root.
- Project Settings can edit the workspace root.
- Create workspace writes to `${project.workspaceRoot}/${workspaceName}`.

Remove Project never scans the whole workspace root. It only operates on workspace paths already registered in Grove for that project.

## Remove Project Semantics

Remove Project behavior is determined by Global Settings.

### Only Remove From Grove

For projects with zero, one, or multiple workspaces:

- Do not run workspace archive commands.
- Do not call `git worktree remove`.
- Delete Grove records for the project, its workspaces, git state, project commands, and related operation metadata according to repository constraints.
- Leave all filesystem directories untouched.

### Also Delete Managed Git Worktrees When Safe

For projects with one or multiple active managed workspaces:

1. Preflight every active registered workspace.
2. If any workspace is dirty, fail the whole remove project operation before running any archive command or deleting any worktree directory.
3. If preflight passes, process workspaces in a stable order, such as workspace path or creation order.
4. For each workspace:
   - Run the project's archive command if configured.
   - On success, run `git worktree remove` for that workspace path.
5. If any workspace archive command or `git worktree remove` fails:
   - Mark the project remove operation failed.
   - Stop processing further workspaces.
   - Keep the project record.
   - Preserve enough state and logs to show which workspace failed.
6. After all active managed workspaces are successfully removed, delete the Grove project records.

Hidden and stale workspace records are not deletion candidates for filesystem removal. They are removed from Grove records as part of project removal.

The main repository root is never deleted in either mode.

## Archive Workspace Semantics

Archive workspace resolves its effective behavior as:

1. Project archive override, if not `use_global`.
2. Global default archive behavior.

If the effective behavior is Ask every time, the frontend opens a Grove bottom-sheet choice, not `window.confirm`.

If the effective behavior is Hide in Grove only:

- Run archive command if configured.
- Mark the workspace hidden in Grove.
- Do not delete the worktree directory.

If the effective behavior is Delete git worktree directory when safe:

- Check dirty status.
- Reject dirty workspaces.
- Run archive command if configured.
- Run `git worktree remove`.
- Mark or remove the Grove workspace record according to repository policy.

## Retry Semantics

Failed operations surface View Log and Retry.

- Setup failure after worktree creation: retry only runs setup in the existing workspace. It must not repeat `git worktree add`.
- Archive failure: retry reruns archive workflow while the workspace remains active.
- Remove project failure: retry reruns the remove project workflow using current project/workspace records and the current Global Settings behavior.

Retry success clears failed operation display state after reload.

## Frontend State And Data Flow

The frontend should derive display state from backend DTOs:

- Workspace lifecycle status.
- Workspace operation status.
- Latest operation status/log metadata where needed.

Toast remains transient feedback only. It must not be the source of truth for operation failure.

Loading flow:

- On mount, list persisted projects.
- Empty state offers explicit import and add actions.
- After import/create/archive/remove/retry, reload projects and operation metadata.
- Refresh remains an internal command for synchronizing actual git state; it does not need a prominent user-facing button in this design.

## Data And Migration

App settings need new keys:

- `default_archive_behavior`
- `remove_project_behavior`

Project archive policy needs a `use_global` value or nullable override.

Migration rules:

- Existing project archive policies `ask`, `hide`, and `remove_worktree` are preserved as project overrides.
- New projects default to `use_global`.
- Existing `project_commands.run` rows may remain in SQLite temporarily, but frontend no longer displays or uses Run Command. Backend code should ignore `run` for Grove workflows.

Generated TypeScript bindings must be regenerated for any Rust DTO or command changes.

## Testing Plan

### Rust Tests

Archive behavior:

- Project override wins over global default.
- `use_global` follows global default.
- Existing migrated projects preserve old archive behavior.

Remove project:

- Only remove from Grove with zero, one, and multiple workspaces.
- Destructive remove with multiple clean workspaces archives and removes each registered active workspace in stable order.
- Dirty workspace in a multi-workspace project fails the entire operation before any archive command or deletion.
- Failure on the Nth workspace stops later processing, keeps the project record, and records the failed workspace in logs.
- Main repo root is never deleted.
- Only registered workspace paths are candidates; unrelated files/directories under `workspaceRoot` are not touched.
- Hidden and stale workspaces are removed from Grove records without filesystem deletion.

Operation locks:

- Running workspace operation blocks mutating operations on that workspace.
- Running project remove blocks mutating operations on that project.
- Different projects do not block each other.
- Failed operation allows retry.

Retry:

- Setup retry does not call `git worktree add` again.
- Archive retry succeeds after a previously failed archive command is fixed.
- Remove project retry succeeds after dirty state or failing archive command is resolved.

Logs:

- Setup, archive, and remove project operations write operation records and logs.
- Missing log file returns a UI-safe error.
- Log content is accessed through backend commands, not direct frontend filesystem access.

Refresh and import:

- Refresh marks externally missing active workspaces stale.
- Refresh discovers new registered worktrees under the project workspace root.
- Import with no candidates succeeds with an empty result.
- Import does not run setup, archive, remove, or mutate real worktree files.

### Frontend Tests

- Empty state calls import and add handlers separately.
- How it works renders as an external link and does not mutate panel state.
- Worktree action sheet no longer renders Run Command.
- Global Settings saves archive default and remove project behavior without executing removal.
- Project Settings saves workspace root, setup/archive commands, archive override, and exposes Remove Project.
- Remove Project confirmation includes that the main repo is never deleted.
- Running operations disable dangerous actions.
- Failed operations show View Log and Retry.
- Effective archive behavior renders the correct confirmation or direct action.

### Verification Commands

Required checks:

```bash
pnpm format:check
pnpm lint
pnpm build
cd src-tauri && cargo test
cd src-tauri && cargo test export_bindings
node scripts/check-docs.mjs
```

If a frontend test runner is added, its command must be added to `package.json` and this verification list.

Because this touches Tauri commands, SQLite, operation logs, and destructive filesystem behavior, manual verification with `pnpm tauri:dev` is required before considering the implementation complete.

## Documentation Updates

Implementation must update:

- `docs/modules/worktrees/README.md`
- `docs/modules/tauri-runtime/README.md`
- `docs/modules/use_cases/README.md`
- `docs/modules/infrastructure/README.md`
- `docs/modules/contracts/README.md` if shared frontend contracts change
- `docs/testing.md`
- `docs/topics/worktree-command-simulation.md`, which is currently stale and should either be rewritten as historical context or replaced by the operation workflow boundary

Source file headers must be updated for every changed source file.
