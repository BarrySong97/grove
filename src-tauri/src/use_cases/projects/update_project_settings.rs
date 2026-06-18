// @purpose Persists Grove project settings edited from the Worktrees panel.
// @role    Project use case for workspace root, commands, and archive policy updates.
// @deps    project repository, project DTOs, shared errors
// @gotcha  This updates Grove overrides only; it never writes Conductor config files.
use std::path::Path;

use sqlx::SqlitePool;

use crate::infrastructure::db::repositories::projects_repository;
use crate::shared::dto::errors::{AppError, AppResult};
use crate::shared::dto::projects::{ProjectDto, UpdateProjectSettingsInput};

pub(crate) async fn run(
    pool: &SqlitePool,
    input: UpdateProjectSettingsInput,
) -> AppResult<ProjectDto> {
    let workspace_root = input.workspace_root.trim();
    validate_workspace_root(workspace_root)?;

    projects_repository::update_project_settings(
        pool,
        &input.project_id,
        workspace_root,
        &input.archive_policy,
    )
    .await?;
    projects_repository::upsert_project_command(
        pool,
        &input.project_id,
        "setup",
        &input.commands.setup,
        "grove_override",
    )
    .await?;
    projects_repository::upsert_project_command(
        pool,
        &input.project_id,
        "archive",
        &input.commands.archive,
        "grove_override",
    )
    .await?;

    projects_repository::get_project(pool, &input.project_id).await
}

fn validate_workspace_root(value: &str) -> AppResult<()> {
    if value.is_empty() || !Path::new(value).is_absolute() {
        return Err(AppError::InvalidRepo {
            message: "Workspace root must be an absolute path.".into(),
        });
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn workspace_root_must_be_absolute() {
        assert!(validate_workspace_root("/tmp/grove-workspaces").is_ok());
        assert!(validate_workspace_root("relative/workspaces").is_err());
        assert!(validate_workspace_root("").is_err());
    }
}
