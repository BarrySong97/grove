// @purpose Archives a workspace by running archive command and applying hide/remove policy.
// @role    Workspace use case for archive policy execution and operation logging.
// @deps    repositories, git status/worktree adapters, process runner, archive DTOs
// @gotcha  remove_worktree is rejected for dirty workspaces; hide never deletes directories.
use std::path::{Path, PathBuf};
use std::time::{SystemTime, UNIX_EPOCH};

use sqlx::SqlitePool;

use crate::infrastructure::db::repositories::{
    operations_repository, projects_repository, settings_repository, workspaces_repository,
};
use crate::infrastructure::git::{status_repository, worktree_repository};
use crate::infrastructure::process::command_runner;
use crate::shared::dto::errors::{AppError, AppResult};
use crate::shared::dto::projects::ArchivePolicyDto;
use crate::shared::dto::workspaces::{ArchivePolicyChoiceDto, ArchiveWorkspaceInput, WorkspaceDto};

pub(crate) async fn run(
    pool: &SqlitePool,
    input: ArchiveWorkspaceInput,
    log_root: PathBuf,
) -> AppResult<WorkspaceDto> {
    let workspace = workspaces_repository::get_workspace(pool, &input.workspace_id).await?;
    let project = projects_repository::get_project(pool, &workspace.project_id).await?;
    if operations_repository::has_running_project_remove_operation(pool, &project.id).await?
        || operations_repository::has_running_workspace_operation(pool, &workspace.id).await?
    {
        return Err(AppError::OperationConflict {
            message: "Another operation is already running for this workspace.".into(),
        });
    }
    let operation_id = operation_id("archive");
    operations_repository::start_operation(
        pool,
        &operation_id,
        &project.id,
        Some(&workspace.id),
        "archive",
    )
    .await?;
    workspaces_repository::update_operation_status(pool, &workspace.id, "archiving").await?;

    let mut operation_exit_code = None;
    let mut operation_log_path = None;
    let result = archive_steps(
        pool,
        &project,
        &workspace,
        &input,
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
            workspaces_repository::update_operation_status(pool, &workspace.id, "failed").await?;
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

async fn archive_steps(
    pool: &SqlitePool,
    project: &crate::shared::dto::projects::ProjectDto,
    workspace: &WorkspaceDto,
    input: &ArchiveWorkspaceInput,
    operation_id: &str,
    log_root: &Path,
    operation_exit_code: &mut Option<i32>,
    operation_log_path: &mut Option<String>,
) -> AppResult<WorkspaceDto> {
    let workspace_path = Path::new(&workspace.path);
    let policy = resolve_policy(pool, project, input).await?;
    let commands = projects_repository::get_project_commands(pool, &project.id).await?;
    if !commands.archive.trim().is_empty() {
        let log_path = log_root.join(format!("{operation_id}-archive.log"));
        *operation_log_path = Some(log_path.to_string_lossy().to_string());
        let result = command_runner::run_workspace_command(
            &commands.archive,
            workspace_path,
            Path::new(&project.root_path),
            &workspace.name,
            &project.default_branch,
            &log_path,
        )?;
        *operation_exit_code = Some(result.exit_code);
        *operation_log_path = Some(result.log_path);
    }

    if input.remember_policy {
        let policy = match &input.policy {
            Some(ArchivePolicyChoiceDto::Hide) => ArchivePolicyDto::Hide,
            Some(ArchivePolicyChoiceDto::RemoveWorktree) => ArchivePolicyDto::RemoveWorktree,
            None => ArchivePolicyDto::UseGlobal,
        };
        projects_repository::set_archive_policy(pool, &project.id, &policy).await?;
    }

    if matches!(policy, ArchivePolicyChoiceDto::RemoveWorktree) {
        if status_repository::is_dirty(workspace_path)? {
            return Err(AppError::WorkspaceDirty {
                message: "Workspace has local changes; remove_worktree is not allowed.".into(),
            });
        }
        worktree_repository::remove_worktree(Path::new(&project.root_path), workspace_path)?;
    }

    workspaces_repository::hide_workspace(pool, &workspace.id).await?;
    workspaces_repository::get_workspace(pool, &workspace.id).await
}

async fn resolve_policy(
    pool: &SqlitePool,
    project: &crate::shared::dto::projects::ProjectDto,
    input: &ArchiveWorkspaceInput,
) -> AppResult<ArchivePolicyChoiceDto> {
    if let Some(policy) = &input.policy {
        return Ok(policy.clone());
    }

    let policy = match project.archive_policy {
        ArchivePolicyDto::UseGlobal => settings_repository::get_app_settings(pool)
            .await?
            .default_archive_policy,
        ref policy => policy.clone(),
    };
    match policy {
        ArchivePolicyDto::Hide => Ok(ArchivePolicyChoiceDto::Hide),
        ArchivePolicyDto::RemoveWorktree => Ok(ArchivePolicyChoiceDto::RemoveWorktree),
        ArchivePolicyDto::Ask | ArchivePolicyDto::UseGlobal => Err(AppError::InvalidRepo {
            message: "Archive choice is required for this workspace.".into(),
        }),
    }
}

fn operation_id(prefix: &str) -> String {
    let millis = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|value| value.as_millis())
        .unwrap_or_default();
    format!("{prefix}-{millis}")
}
