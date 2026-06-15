// @purpose Creates a new git worktree workspace and optionally runs setup.
// @role    Workspace use case for create -> copy files -> setup -> refresh.
// @deps    project/workspace/operation repositories, git/filesystem/process adapters, workspace DTOs
// @gotcha  First implementation uses local refs only and does not run git fetch.
use std::fs;
use std::path::{Path, PathBuf};
use std::time::{SystemTime, UNIX_EPOCH};

use sqlx::SqlitePool;

use crate::infrastructure::conductor::config_repository;
use crate::infrastructure::db::repositories::{
    operations_repository, projects_repository, workspaces_repository,
};
use crate::infrastructure::filesystem::file_copy;
use crate::infrastructure::git::{status_repository, worktree_repository};
use crate::infrastructure::process::command_runner;
use crate::shared::dto::errors::{AppError, AppResult};
use crate::shared::dto::workspaces::{
    CreateWorkspaceInput, WorkspaceDto, WorkspaceLifecycleStatusDto, WorkspaceOperationStatusDto,
};

pub(crate) async fn run(
    pool: &SqlitePool,
    input: CreateWorkspaceInput,
    log_root: PathBuf,
) -> AppResult<WorkspaceDto> {
    let project = projects_repository::get_project(pool, &input.project_id).await?;
    validate_workspace_name(&input.name)?;
    validate_branch_name(&input.branch)?;

    let workspace_root = PathBuf::from(&project.workspace_root);
    fs::create_dir_all(&workspace_root)?;
    let workspace_root = workspace_root.canonicalize().unwrap_or(workspace_root);
    let workspace_path = workspace_root.join(&input.name);
    if workspace_path.exists() {
        return Err(AppError::WorkspaceExists {
            message: format!(
                "Workspace path already exists: {}",
                workspace_path.display()
            ),
        });
    }

    let operation_id = operation_id("create");
    operations_repository::start_operation(pool, &operation_id, &project.id, None, "create")
        .await?;
    let mut operation_exit_code = None;
    let mut operation_log_path = None;
    let result = create_workspace_steps(
        pool,
        &project,
        &input,
        &workspace_path,
        &operation_id,
        &log_root,
        &mut operation_exit_code,
        &mut operation_log_path,
    )
    .await;

    match result {
        Ok(workspace) => {
            operations_repository::finish_operation(
                pool,
                &operation_id,
                "succeeded",
                operation_exit_code.or(Some(0)),
                operation_log_path.as_deref(),
                None,
            )
            .await?;
            Ok(workspace)
        }
        Err(error) => {
            operations_repository::finish_operation(
                pool,
                &operation_id,
                "failed",
                operation_exit_code.or(Some(1)),
                operation_log_path.as_deref(),
                Some(&error.to_string()),
            )
            .await?;
            Err(error)
        }
    }
}

async fn create_workspace_steps(
    pool: &SqlitePool,
    project: &crate::shared::dto::projects::ProjectDto,
    input: &CreateWorkspaceInput,
    workspace_path: &Path,
    operation_id: &str,
    log_root: &Path,
    operation_exit_code: &mut Option<i32>,
    operation_log_path: &mut Option<String>,
) -> AppResult<WorkspaceDto> {
    let root_path = Path::new(&project.root_path);
    worktree_repository::add_worktree(
        root_path,
        workspace_path,
        &input.branch,
        &input.base_branch,
    )?;
    let config = config_repository::read_project_config(root_path)?;
    file_copy::copy_matching_files(root_path, workspace_path, &config.file_include_globs)?;

    let workspace = WorkspaceDto {
        id: stable_id(&workspace_path.to_string_lossy()),
        project_id: project.id.clone(),
        name: input.name.clone(),
        branch: input.branch.clone(),
        base_branch: Some(input.base_branch.clone()),
        path: workspace_path.to_string_lossy().to_string(),
        lifecycle_status: WorkspaceLifecycleStatusDto::Active,
        operation_status: if input.run_setup {
            WorkspaceOperationStatusDto::SettingUp
        } else {
            WorkspaceOperationStatusDto::Idle
        },
        hidden_at: None,
        stale_at: None,
        git_state: None,
    };
    workspaces_repository::upsert_workspace(pool, &workspace).await?;

    if input.run_setup {
        let commands = projects_repository::get_project_commands(pool, &project.id).await?;
        if !commands.setup.trim().is_empty() {
            let log_path = log_root.join(format!("{operation_id}-setup.log"));
            *operation_log_path = Some(log_path.to_string_lossy().to_string());
            let result = command_runner::run_workspace_command(
                &commands.setup,
                workspace_path,
                root_path,
                &input.name,
                &project.default_branch,
                &log_path,
            )?;
            *operation_exit_code = Some(result.exit_code);
            *operation_log_path = Some(result.log_path);
        }
    }

    let state = status_repository::read_git_state(workspace_path)?;
    workspaces_repository::upsert_git_state(pool, &workspace.id, &state).await?;
    workspaces_repository::update_operation_status(pool, &workspace.id, "idle").await?;
    workspaces_repository::get_workspace(pool, &workspace.id).await
}

fn validate_workspace_name(value: &str) -> AppResult<()> {
    if value.trim().is_empty() || value.contains("..") || value.contains('/') {
        return Err(AppError::InvalidRepo {
            message: "Workspace names must be non-empty and path-safe.".into(),
        });
    }
    Ok(())
}

fn validate_branch_name(value: &str) -> AppResult<()> {
    if value.trim().is_empty()
        || value.contains("..")
        || value.starts_with('/')
        || value.ends_with('/')
        || value.contains("//")
    {
        return Err(AppError::InvalidRepo {
            message: "Branch names must be non-empty git ref names.".into(),
        });
    }
    Ok(())
}

fn operation_id(prefix: &str) -> String {
    let millis = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|value| value.as_millis())
        .unwrap_or_default();
    format!("{prefix}-{millis}")
}

fn stable_id(value: &str) -> String {
    use std::collections::hash_map::DefaultHasher;
    use std::hash::{Hash, Hasher};
    let mut hasher = DefaultHasher::new();
    value.hash(&mut hasher);
    format!("{:016x}", hasher.finish())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn workspace_name_must_be_path_safe() {
        assert!(validate_workspace_name("feature-login").is_ok());
        assert!(validate_workspace_name("../outside").is_err());
        assert!(validate_workspace_name("feature/login").is_err());
    }

    #[test]
    fn branch_name_allows_slash_hierarchy() {
        assert!(validate_branch_name("feature/login").is_ok());
        assert!(validate_branch_name("/feature").is_err());
        assert!(validate_branch_name("feature/").is_err());
        assert!(validate_branch_name("feature//login").is_err());
    }
}
