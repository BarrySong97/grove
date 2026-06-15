# Grove Conductor Worktree Backend Design

## Purpose
Grove will become a standalone menu bar manager for Conductor-style git worktree workspaces. It will use the same default workspace location and configuration conventions as Conductor, while focusing only on project/workspace management: import, refresh, create, setup, open tools, archive, and visibility.

Grove will not implement Conductor agent chat, review, pull request, or task orchestration features.

## Scope
This design covers the first full backend loop:

- Import existing Conductor projects and workspaces.
- Read Conductor-compatible project configuration.
- Persist Grove project/workspace state locally.
- Refresh real git worktree metadata.
- Create new workspaces with `git worktree add`.
- Copy local ignored files using Conductor-compatible rules.
- Run setup and archive commands.
- Open workspaces in Finder, Zed, Cursor, VS Code, Ghostty, and macOS Terminal.
- Archive workspaces using a project-level policy.
- Replace frontend mock data with type-safe Tauri command calls.

## Architecture
The backend stays in the existing Tauri Rust crate. Grove will not add a TypeScript backend or tRPC layer. Frontend/backend type safety comes from Rust DTOs exported to TypeScript with `specta` and `tauri-specta`.

```text
React frontend
  -> generated TypeScript command bindings
  -> Tauri commands
  -> Rust use cases
  -> Rust domain rules
  -> infrastructure adapters
  -> SQLite, git, filesystem, process, native apps
```

Rust backend layout:

```text
src-tauri/src/
  shared/
    dto/
      projects.rs
      workspaces.rs
      conductor.rs
      operations.rs
      errors.rs

  presentation/
    commands/
      projects.rs
      workspaces.rs
      native.rs

  use_cases/
    projects/
      import_conductor_projects.rs
      list_projects.rs
      refresh_project.rs
    workspaces/
      create_workspace.rs
      archive_workspace.rs
      open_workspace.rs

  domain/
    conductor/
      config_resolution.rs
      files_to_copy.rs
      workspace_paths.rs
    workspaces/
      archive_policy.rs
      branch_name.rs
      workspace_status.rs

  infrastructure/
    db/
      migrations/
      repositories/
      connection.rs
    git/
      worktree_repository.rs
      status_repository.rs
    conductor/
      config_repository.rs
    filesystem/
      file_copy.rs
      path_checks.rs
    process/
      command_runner.rs
    native/
      editor_opener.rs
      terminal_opener.rs
      finder_opener.rs
```

Frontend layout changes:

```text
src/shared/bindings/commands.ts
src/modules/worktrees/api/
src/modules/worktrees/hooks/
src/modules/worktrees/components/
```

The current frontend `mock-projects-repository.ts` will be retired once real command wiring is in place.

## Data Model
SQLite stores Grove state only. It is not the source of truth for git status, Conductor config, or filesystem state.

### `projects`

Stores a registered repository.

- `id`: Grove project identifier.
- `name`: display name, usually the repo directory name.
- `root_path`: original repository checkout path, such as `~/Code/acme-web`.
- `workspace_root`: parent directory for workspaces, usually `~/conductor/workspaces/<repo-name>`.
- `default_branch`: default base branch for new workspaces.
- `config_source`: where the active config came from.
- `archive_policy`: project default after archive command succeeds.
- `created_at`, `updated_at`: audit fields.

`config_source` values:

```text
conductor_settings
conductor_json
grove_override
none
```

`archive_policy` values:

```text
ask
hide
remove_worktree
```

Default policy is `ask`. When the user archives a workspace for the first time, Grove asks whether to hide or remove the git worktree, then saves that choice for the project. The setting can be changed later.

### `project_commands`

Stores resolved commands for each project.

- `project_id`: owning project.
- `kind`: `setup`, `archive`, or `run`.
- `command`: shell command text.
- `source`: `conductor` or `grove_override`.
- `enabled`: explicit enable/disable flag.

First implementation executes `setup` and `archive`. `run` can be parsed and displayed but does not need full run process management in the first loop.

### `workspaces`

Stores worktree workspaces managed or discovered by Grove. The primary repository checkout is stored on `projects.root_path`, not as a workspace row.

- `id`: Grove workspace identifier.
- `project_id`: owning project.
- `name`: workspace display name.
- `branch`: actual git branch name.
- `base_branch`: branch used when the workspace was created, if known.
- `path`: actual workspace directory.
- `lifecycle_status`: durable visibility/consistency state.
- `operation_status`: current operation state for UI and locking.
- `hidden_at`: when Grove hid the workspace after archive.
- `stale_at`: when Grove detected DB and filesystem/git state mismatch.
- `last_seen_at`: last refresh time where the workspace was observed.
- `created_at`, `updated_at`: audit fields.

`lifecycle_status` values:

```text
active
hidden
stale
```

`operation_status` values:

```text
idle
creating
setting_up
archiving
failed
```

Grove will not store or display a `current` workspace. The app cannot reliably know which workspace the user is currently using across editors, terminals, and concurrent sessions.

### `workspace_git_state`

Stores the latest refresh snapshot for display.

- `workspace_id`: owning workspace.
- `ahead`: commits ahead of upstream or comparison target.
- `behind`: commits behind upstream or comparison target.
- `dirty`: number of changed files.
- `last_commit_message`: latest commit summary.
- `captured_at`: time of the snapshot.

This table stays separate from `workspaces` in the first implementation. The separation keeps durable Grove lifecycle state distinct from cached git metadata. Git state is refreshed from git commands and is not authoritative persistent state.

### `operations`

Stores long-running or fallible work.

- `id`: operation identifier.
- `project_id`: owning project.
- `workspace_id`: optional workspace.
- `kind`: `import`, `refresh`, `create`, `setup`, `archive`, `open_editor`, `open_terminal`, or `reveal_finder`.
- `status`: `queued`, `running`, `succeeded`, or `failed`.
- `started_at`, `finished_at`: operation timing.
- `exit_code`: process exit code, if applicable.
- `log_path`: path to command log output.
- `error_message`: short UI-safe failure summary.

Setup/archive logs can be long, so Grove stores log files and keeps only the path plus summary in SQLite.

## Conductor Compatibility

### Workspace Location

Grove first reads Conductor user settings for the workspace location. If no value is found, it uses:

```text
~/conductor/workspaces
```

Project workspace roots default to:

```text
~/conductor/workspaces/<repo-name>
```

Users can override workspace roots in Grove.

### Import From Conductor

Import is read-only discovery. It must not create, modify, move, delete, setup, or archive anything.

Flow:

```text
resolve workspace root
-> scan <workspace-root>/<repo-name>/<workspace-name>
-> verify candidate directories with git
-> group workspaces by git worktree group
-> infer project root checkout
-> read Conductor config
-> write projects/workspaces/commands to Grove DB
-> return import candidates and warnings
```

Warnings should not block import unless the path is not a git worktree or the project root cannot be inferred.

### Config Resolution

Grove resolves project config in this order:

```text
<repo>/.conductor/settings.local.toml
> <repo>/.conductor/settings.toml
> ~/.conductor/settings.toml
> <repo>/conductor.json
> built-in defaults
```

If `<repo>/.conductor/settings.toml` exists, repo-level `conductor.json` is ignored because the project has migrated to the new config shape.

First implementation needs these config areas:

- `scripts.setup`
- `scripts.archive`
- `scripts.run`
- `file_include_globs`
- workspace location

### Files To Copy

Files are copied only when creating a new workspace, not during import.

Resolution order:

```text
.worktreeinclude
> .conductor/settings.toml file_include_globs
> default .env*
```

Only gitignored files from the source repo that match the selected patterns are copied. Relative paths are preserved in the destination workspace.

Example:

```text
~/Code/acme-web/.env.local
-> ~/conductor/workspaces/acme-web/foo/.env.local
```

## Workspace Creation

Create workspace flow:

```text
validate input
-> resolve project and Conductor config
-> ensure target path does not exist
-> run git worktree add <workspace-path> -b <branch> <base-branch>
-> copy files using Conductor-compatible rules
-> run setup command if configured and enabled
-> refresh git metadata
-> return WorkspaceDto
```

Setup command environment:

```text
CONDUCTOR_WORKSPACE_NAME
CONDUCTOR_WORKSPACE_PATH
CONDUCTOR_ROOT_PATH
CONDUCTOR_DEFAULT_BRANCH
CONDUCTOR_PORT
CONDUCTOR_IS_LOCAL=true
```

Commands run with the workspace path as current working directory. Rust must use `std::process::Command` arguments and controlled shell invocation helpers rather than unsafe string interpolation for filesystem paths.

The first implementation does not run `git fetch` automatically before creation. It creates from local refs only. If the requested base branch/ref is missing locally, Grove returns a typed `git_command_failed` error with the underlying git message.

## Archive Behavior

Archive behavior is project-policy driven:

```text
ask
hide
remove_worktree
```

Flow:

```text
validate workspace
-> start archive operation
-> run archive command in workspace path if configured and enabled
-> if archive command fails: mark operation failed and leave workspace active
-> if policy is hide: set lifecycle_status=hidden and hidden_at
-> if policy is remove_worktree: run git worktree remove <path>, then set lifecycle_status=hidden
-> refresh project state
-> finish operation
```

`git worktree remove` deletes the actual workspace directory and unregisters it from git's worktree registry. It does not delete the branch. Grove must explain this in the confirmation UI.

First implementation should reject `remove_worktree` if the workspace is dirty. Users can still choose `hide`, which keeps the directory and git worktree registration intact.

## Native Openers

First implementation supports:

Editors and file tools:

- Finder / Reveal in Finder
- Zed
- Cursor
- VS Code

Terminals:

- Ghostty
- macOS Terminal.app

Opening is implemented behind native adapters, not hard-coded in UI:

```text
infrastructure/native/finder_opener.rs
infrastructure/native/editor_opener.rs
infrastructure/native/terminal_opener.rs
```

Implementation should research each tool before coding. Expected direction:

- Finder: `open -R <path>` for reveal, or `open <directory>`.
- Zed: prefer `zed <path>`, fallback to `open -a Zed <path>`.
- Cursor: prefer `cursor <path>`, fallback to `open -a Cursor <path>`.
- VS Code: prefer `code <path>`, fallback to `open -a "Visual Studio Code" <path>`.
- Ghostty: use the most reliable macOS-supported path after research.
- Terminal.app: AppleScript or native macOS API to open a shell in the workspace directory.

Paths must be safely passed as arguments. Any AppleScript path handling must be centralized and quoted correctly.

## Type-Safe Frontend/Backend API

Rust owns command DTOs:

```rust
#[derive(serde::Serialize, serde::Deserialize, specta::Type)]
pub struct ProjectDto {
    pub id: String,
    pub name: String,
    pub root_path: String,
    pub workspace_root: String,
}
```

Tauri command handlers are thin:

```rust
#[tauri::command]
#[specta::specta]
pub async fn list_projects() -> Result<Vec<ProjectDto>, AppErrorDto> {
    // call use case
}
```

Generated TypeScript bindings live at:

```text
src/shared/bindings/commands.ts
```

Frontend code calls generated `commands.*` helpers rather than raw `invoke(...)` strings for business APIs.

新增业务 command 必须同步:

- Rust DTO.
- Rust Tauri command.
- `generate_handler!`.
- Tauri capability.
- `tauri-specta` export.
- Frontend API wrapper.
- Module documentation and file headers.

## Errors

All business commands return a typed error:

```text
AppErrorDto
  code
  message
  details
  recoverable
```

Error codes:

```text
config_not_found
invalid_repo
git_command_failed
workspace_exists
workspace_dirty
command_failed
native_open_failed
database_error
permission_denied
```

Frontend behavior:

- Recoverable errors show a toast and retry affordance.
- `command_failed` shows a log link.
- Archive policy `ask` opens a choice modal.
- `remove_worktree` requires a confirmation explaining directory deletion.
- Import warnings display in the import view without blocking safe candidates.

## Concurrency

Grove allows operations on different workspaces to run concurrently.

For a single workspace, only one mutating operation can run at a time:

```text
create
setup
archive
remove_worktree
```

Open editor/terminal/finder operations can run while a workspace is idle. Mutating operations should be blocked when `operation_status` is not `idle` or `failed`.

## Milestones

1. Backend foundation
   - Add `sqlx` and SQLite migrations.
   - Add Rust DTOs and typed errors.
   - Add `specta` / `tauri-specta` export.
   - Add repository traits and DB connection state.

2. Import and refresh
   - Resolve Conductor workspace root.
   - Scan existing Conductor workspaces.
   - Parse Conductor config and legacy `conductor.json`.
   - Parse `git worktree list --porcelain`.
   - Persist imported projects/workspaces.
   - Replace frontend mock list with real list command.

3. Create workspace
   - Validate branch/workspace names.
   - Run `git worktree add`.
   - Implement Files to copy.
   - Run setup command.
   - Capture logs and operation status.

4. Native openers
   - Research and implement Finder, Zed, Cursor, VS Code, Ghostty, and Terminal.app adapters.
   - Add frontend menu actions.

5. Archive policy
   - Add archive ask modal.
   - Save project archive policy.
   - Run archive command.
   - Implement hide and remove-worktree paths.
   - Reject remove-worktree for dirty workspaces.

6. UI completion
   - Add import flow.
   - Add project settings for workspace root, commands, and archive policy.
   - Add operation logs and retry affordances.
   - Remove frontend mock repository.

## Testing And Verification

Rust tests:

- Conductor config parser fixtures.
- Legacy `conductor.json` parser fixtures.
- Config precedence tests.
- Git worktree porcelain parser fixtures.
- Files-to-copy matching tests.
- Workspace path and branch-name validation tests.
- Command runner environment variable tests.
- Archive policy tests.

Project checks:

```bash
cargo test
pnpm lint
pnpm build
node scripts/check-docs.mjs
```

Manual verification:

- Import existing `~/conductor/workspaces`.
- Create a workspace.
- Verify copied files.
- Verify setup command runs and logs.
- Open Finder, Zed, Cursor, VS Code, Ghostty, and Terminal.app.
- Archive with `ask -> hide`.
- Archive with `ask -> remove_worktree` on a clean workspace.
- Verify remove-worktree is rejected on a dirty workspace.

## Definition Of Done

This spec is complete only when every item below has direct evidence from code, generated artifacts, automated checks, or manual E2E verification.

1. Backend architecture
   - Rust backend modules follow the planned presentation/use-case/domain/infrastructure boundaries.
   - SQLite migrations cover `projects`, `project_commands`, `workspaces`, `workspace_git_state`, and `operations`.
   - Use cases, not Tauri handlers, own import, refresh, create, setup, archive, and open workflows.
   - Grove DB stores Grove state only; git status, Conductor config, and filesystem state are refreshed from their source of truth.

2. Type safety
   - Every business command has Rust DTO input/output/error types.
   - Every business command is registered with `tauri-specta` and exported to `src/shared/bindings/commands.ts`.
   - Frontend business code calls generated command bindings through module `api/` wrappers, not raw `invoke(...)` strings.
   - `cd src-tauri && cargo test export_bindings` passes and leaves no binding drift.

3. Conductor import
   - Grove scans the default `~/conductor/workspaces` location.
   - Grove honors a Conductor workspace location override when present.
   - Grove resolves `.conductor/settings.local.toml`, `.conductor/settings.toml`, `~/.conductor/settings.toml`, and `conductor.json` fallback using the documented precedence.
   - Importing existing workspaces is read-only: it does not move, modify, setup, archive, or delete anything.

4. Real git/worktree behavior
   - The Worktrees UI no longer depends on `mock-projects-repository.ts`.
   - Project/workspace data shown in the UI comes from SQLite plus git refresh, not frontend mock state.
   - Creating a workspace executes real `git worktree add`.
   - Refreshing a project makes Grove state consistent with `git worktree list --porcelain`.

5. Files to copy
   - `.worktreeinclude` is supported.
   - `.conductor/settings.toml` `file_include_globs` is supported.
   - Default `.env*` copy behavior works when no stronger rule exists.
   - Only gitignored files matching the active rule are copied, preserving relative paths.

6. Setup and archive
   - Setup command runs in the new workspace directory after creation.
   - Archive command runs in the workspace directory before hide/remove behavior.
   - Archive policy defaults to `ask`.
   - First archive choice can be saved per project.
   - `hide` marks the workspace hidden without deleting the directory or unregistering the git worktree.
   - `remove_worktree` runs `git worktree remove` only for clean workspaces.
   - Dirty workspaces reject `remove_worktree` and can still use `hide`.

7. Native openers
   - Finder, Zed, Cursor, VS Code, Ghostty, and macOS Terminal open the selected workspace path.
   - Paths containing spaces are handled correctly.
   - Open failures return typed errors and show user-visible feedback.

8. Verification gates
   - `cd src-tauri && cargo test` passes.
   - `cd src-tauri && cargo test export_bindings` passes.
   - `pnpm format:check` passes.
   - `pnpm lint` passes.
   - `pnpm build` passes.
   - `node scripts/check-docs.mjs` passes.
   - A real-repo manual E2E run covers import, refresh, create/setup, files-to-copy, native openers, archive hide, archive remove, and dirty remove rejection.

## Open Decisions Resolved

- Backend stays Rust, not TypeScript.
- Type safety uses Rust-generated TypeScript bindings, not tRPC.
- `current` workspace is not modeled.
- Primary repository checkout is stored as `projects.root_path`, not as a workspace item.
- Workspace state uses `lifecycle_status` plus `operation_status`.
- Archive policy defaults to `ask` and is saved per project after first choice.
- Files to copy are supported in the first implementation loop.
