// @purpose Exposes workspace-related backend use cases.
// @role    Workspace use-case barrel consumed by Tauri commands.
// @deps    refresh_project, create_workspace, list_base_branches, archive_workspace, retry_workspace_operation, open_workspace
// @gotcha  Mutating workflows must update operation status and avoid concurrent conflicting state.
pub(crate) mod archive_workspace;
pub(crate) mod create_workspace;
pub(crate) mod list_base_branches;
pub(crate) mod open_workspace;
pub(crate) mod refresh_project;
pub(crate) mod retry_workspace_operation;
