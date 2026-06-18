// @purpose Removes a Grove project record and optionally its managed clean worktrees.
// @role    Project use case for Project Settings Remove Project destructive workflow.
// @deps    project/workspace/operation/settings repositories, git/process adapters, project DTOs
// @gotcha  Never deletes the main repository root and never scans workspace_root for extra paths.
use std::fs;
use std::path::{Path, PathBuf};
use std::time::{SystemTime, UNIX_EPOCH};

use sqlx::SqlitePool;

use crate::infrastructure::db::repositories::{
    operations_repository, projects_repository, settings_repository, workspaces_repository,
};
use crate::infrastructure::git::{status_repository, worktree_repository};
use crate::infrastructure::process::command_runner;
use crate::shared::dto::errors::{AppError, AppResult};
use crate::shared::dto::projects::RemoveProjectInput;
use crate::shared::dto::settings::RemoveProjectBehaviorDto;
use crate::shared::dto::workspaces::WorkspaceDto;

pub(crate) async fn run(
    pool: &SqlitePool,
    input: RemoveProjectInput,
    log_root: PathBuf,
) -> AppResult<()> {
    if operations_repository::has_running_project_operation(pool, &input.project_id).await? {
        return Err(AppError::OperationConflict {
            message: "Another operation is already running for this project.".into(),
        });
    }

    let project = projects_repository::get_project(pool, &input.project_id).await?;
    let settings = settings_repository::get_app_settings(pool).await?;
    let operation_id = operation_id("remove-project");
    operations_repository::start_operation(
        pool,
        &operation_id,
        &project.id,
        None,
        "remove_project",
    )
    .await?;

    let log_path = log_root.join(format!("{operation_id}.log"));
    let result = match settings.remove_project_behavior {
        RemoveProjectBehaviorDto::GroveOnly => {
            append_log(
                &log_path,
                format!("Removing Grove project record only: {}\n", project.name).as_bytes(),
            );
            projects_repository::delete_project(pool, &project.id).await
        }
        RemoveProjectBehaviorDto::DeleteWorktrees => {
            remove_managed_worktrees(pool, &project, &log_path).await
        }
    };

    match result {
        Ok(()) => {
            let log_path = log_path.to_string_lossy().to_string();
            operations_repository::finish_operation(
                pool,
                &operation_id,
                "succeeded",
                Some(0),
                Some(&log_path),
                None,
            )
            .await?;
            Ok(())
        }
        Err(error) => {
            let log_path = log_path.to_string_lossy().to_string();
            operations_repository::finish_operation(
                pool,
                &operation_id,
                "failed",
                Some(1),
                Some(&log_path),
                Some(&error.to_string()),
            )
            .await?;
            Err(error)
        }
    }
}

async fn remove_managed_worktrees(
    pool: &SqlitePool,
    project: &crate::shared::dto::projects::ProjectDto,
    log_path: &Path,
) -> AppResult<()> {
    let workspaces = workspaces_repository::list_active_project_workspaces(pool, &project.id).await?;
    preflight_clean_workspaces(&workspaces)?;

    let commands = projects_repository::get_project_commands(pool, &project.id).await?;
    for workspace in &workspaces {
        append_log(
            log_path,
            format!("Removing managed worktree: {}\n", workspace.path).as_bytes(),
        );
        if !commands.archive.trim().is_empty() {
            let scratch_log = log_path.with_extension(format!("{}.log", workspace.id));
            let result = command_runner::run_workspace_command(
                &commands.archive,
                Path::new(&workspace.path),
                Path::new(&project.root_path),
                &workspace.name,
                &project.default_branch,
                &scratch_log,
            )?;
            append_log_file(log_path, Path::new(&result.log_path));
        }
        worktree_repository::remove_worktree(
            Path::new(&project.root_path),
            Path::new(&workspace.path),
        )?;
        workspaces_repository::hide_workspace(pool, &workspace.id).await?;
    }

    projects_repository::delete_project(pool, &project.id).await
}

fn preflight_clean_workspaces(workspaces: &[WorkspaceDto]) -> AppResult<()> {
    for workspace in workspaces {
        if status_repository::is_dirty(Path::new(&workspace.path))? {
            return Err(AppError::WorkspaceDirty {
                message: format!(
                    "Workspace has local changes; remove project is blocked: {}",
                    workspace.path
                ),
            });
        }
    }
    Ok(())
}

fn append_log(path: &Path, content: &[u8]) {
    if let Some(parent) = path.parent() {
        let _ = fs::create_dir_all(parent);
    }
    let mut existing = fs::read(path).unwrap_or_default();
    existing.extend_from_slice(content);
    let _ = fs::write(path, existing);
}

fn append_log_file(target: &Path, source: &Path) {
    let content = fs::read(source).unwrap_or_default();
    append_log(target, &content);
}

fn operation_id(prefix: &str) -> String {
    let millis = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|value| value.as_millis())
        .unwrap_or_default();
    format!("{prefix}-{millis}")
}
