// @purpose Opens a workspace path in a supported native target.
// @role    Workspace use case for Finder/editor/terminal actions.
// @deps    workspace repository, native opener, open workspace DTOs
// @gotcha  Open operations do not mutate git or workspace lifecycle state.
use std::path::Path;

use sqlx::SqlitePool;

use crate::infrastructure::db::repositories::workspaces_repository;
use crate::infrastructure::native::opener;
use crate::shared::dto::errors::AppResult;
use crate::shared::dto::workspaces::{OpenWorkspaceInput, WorkspaceDto};

pub(crate) async fn run(pool: &SqlitePool, input: OpenWorkspaceInput) -> AppResult<WorkspaceDto> {
    let workspace = workspaces_repository::get_workspace(pool, &input.workspace_id).await?;
    opener::open(&input.target, Path::new(&workspace.path))?;
    Ok(workspace)
}
