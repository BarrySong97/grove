// @purpose Retries the latest failed setup/create or archive workflow for a workspace.
// @role    Workspace use case for failed operation recovery from the panel UI.
// @deps    operation/project/workspace repositories, process adapter, archive/create use cases
// @gotcha  Setup retry never repeats git worktree add; archive retry delegates to archive workflow.
use std::path::{Path, PathBuf};
use std::time::{SystemTime, UNIX_EPOCH};

use sqlx::SqlitePool;

use crate::infrastructure::db::repositories::{
    operations_repository, projects_repository, workspaces_repository,
};
use crate::infrastructure::git::status_repository;
use crate::infrastructure::process::command_runner;
use crate::shared::dto::errors::{AppError, AppResult};
use crate::shared::dto::operations::OperationKindDto;
use crate::shared::dto::workspaces::{
    ArchiveWorkspaceInput, RetryWorkspaceOperationInput, WorkspaceDto,
};
use crate::use_cases::workspaces::archive_workspace;

pub(crate) async fn run(
    pool: &SqlitePool,
    input: RetryWorkspaceOperationInput,
    log_root: PathBuf,
) -> AppResult<WorkspaceDto> {
    let workspace = workspaces_repository::get_workspace(pool, &input.workspace_id).await?;
    let Some(operation) = operations_repository::latest_for_workspace(pool, &workspace.id).await?
    else {
        return Err(AppError::InvalidRepo {
            message: "No failed operation exists for this workspace.".into(),
        });
    };

    match operation.kind {
        OperationKindDto::Create | OperationKindDto::Setup => {
            retry_setup(pool, workspace, log_root).await
        }
        OperationKindDto::Archive => {
            archive_workspace::run(
                pool,
                ArchiveWorkspaceInput {
                    workspace_id: workspace.id,
                    policy: None,
                    remember_policy: false,
                },
                log_root,
            )
            .await
        }
        _ => Err(AppError::InvalidRepo {
            message: "This workspace operation cannot be retried.".into(),
        }),
    }
}

async fn retry_setup(
    pool: &SqlitePool,
    workspace: WorkspaceDto,
    log_root: PathBuf,
) -> AppResult<WorkspaceDto> {
    let project = projects_repository::get_project(pool, &workspace.project_id).await?;
    if operations_repository::has_running_project_remove_operation(pool, &project.id).await?
        || operations_repository::has_running_workspace_operation(pool, &workspace.id).await?
    {
        return Err(AppError::OperationConflict {
            message: "Another operation is already running for this workspace.".into(),
        });
    }

    let operation_id = operation_id("setup");
    operations_repository::start_operation(
        pool,
        &operation_id,
        &project.id,
        Some(&workspace.id),
        "setup",
    )
    .await?;
    workspaces_repository::update_operation_status(pool, &workspace.id, "setting_up").await?;

    let mut operation_exit_code = Some(0);
    let mut operation_log_path = None;
    let result = async {
        let commands = projects_repository::get_project_commands(pool, &project.id).await?;
        if !commands.setup.trim().is_empty() {
            let log_path = log_root.join(format!("{operation_id}-setup.log"));
            operation_log_path = Some(log_path.to_string_lossy().to_string());
            let result = command_runner::run_workspace_command(
                &commands.setup,
                Path::new(&workspace.path),
                Path::new(&project.root_path),
                &workspace.name,
                &project.default_branch,
                &log_path,
            )
            .await?;
            operation_exit_code = Some(result.exit_code);
            operation_log_path = Some(result.log_path);
        }
        let state = status_repository::read_git_state(Path::new(&workspace.path))?;
        workspaces_repository::upsert_git_state(pool, &workspace.id, &state).await?;
        workspaces_repository::update_operation_status(pool, &workspace.id, "idle").await?;
        workspaces_repository::get_workspace(pool, &workspace.id).await
    }
    .await;

    match result {
        Ok(workspace) => {
            operations_repository::finish_operation(
                pool,
                &operation_id,
                "succeeded",
                operation_exit_code,
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

fn operation_id(prefix: &str) -> String {
    let millis = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|value| value.as_millis())
        .unwrap_or_default();
    format!("{prefix}-{millis}")
}
