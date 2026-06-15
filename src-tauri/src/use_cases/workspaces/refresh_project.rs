// @purpose Refreshes persisted workspace git metadata for a project.
// @role    Workspace use case keeping SQLite cache aligned with git worktree state.
// @deps    project/workspace repositories, git worktree/status adapters, workspace DTOs
// @gotcha  Refresh reads git as source of truth and marks missing active rows stale.
use std::path::{Path, PathBuf};

use sqlx::SqlitePool;

use crate::infrastructure::db::repositories::{projects_repository, workspaces_repository};
use crate::infrastructure::git::{status_repository, worktree_repository};
use crate::shared::dto::errors::AppResult;
use crate::shared::dto::workspaces::{
    RefreshProjectInput, WorkspaceDto, WorkspaceLifecycleStatusDto, WorkspaceOperationStatusDto,
};

pub(crate) async fn run(
    pool: &SqlitePool,
    input: RefreshProjectInput,
) -> AppResult<Vec<WorkspaceDto>> {
    let project = projects_repository::get_project(pool, &input.project_id).await?;
    let worktrees = worktree_repository::list_worktrees(Path::new(&project.root_path))?;
    let workspace_root = PathBuf::from(&project.workspace_root);
    let workspace_root = workspace_root.canonicalize().unwrap_or(workspace_root);

    let mut active_workspace_ids = Vec::new();

    for entry in worktrees
        .iter()
        .filter(|entry| entry.path.starts_with(&workspace_root))
    {
        let name = entry
            .path
            .file_name()
            .and_then(|value| value.to_str())
            .unwrap_or("workspace")
            .to_string();
        let branch = entry.branch.clone().unwrap_or_else(|| name.clone());
        let workspace = WorkspaceDto {
            id: stable_id(&entry.path.to_string_lossy()),
            project_id: project.id.clone(),
            name,
            branch,
            base_branch: Some(project.default_branch.clone()),
            path: entry.path.to_string_lossy().to_string(),
            lifecycle_status: WorkspaceLifecycleStatusDto::Active,
            operation_status: WorkspaceOperationStatusDto::Idle,
            hidden_at: None,
            stale_at: None,
            git_state: None,
        };
        active_workspace_ids.push(workspace.id.clone());
        workspaces_repository::upsert_workspace(pool, &workspace).await?;
        let state = status_repository::read_git_state(Path::new(&workspace.path))?;
        workspaces_repository::upsert_git_state(pool, &workspace.id, &state).await?;
    }

    workspaces_repository::mark_project_workspaces_stale_except(
        pool,
        &project.id,
        &active_workspace_ids,
    )
    .await?;

    workspaces_repository::list_project_workspaces(pool, &project.id).await
}

fn stable_id(value: &str) -> String {
    use std::collections::hash_map::DefaultHasher;
    use std::hash::{Hash, Hasher};
    let mut hasher = DefaultHasher::new();
    value.hash(&mut hasher);
    format!("{:016x}", hasher.finish())
}
