// @purpose Runs user-configured setup/archive commands with Conductor-compatible environment.
// @role    Process adapter used by create and archive workspace use cases.
// @deps    Tauri async runtime, std process/fs/path, shared errors
// @gotcha  User shell commands are blocking work; keep them off async worker threads while preserving login-shell environment loading.
use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;

use crate::shared::dto::errors::{AppError, AppResult};

pub(crate) struct CommandRunResult {
    pub exit_code: i32,
    pub log_path: String,
}

pub(crate) async fn run_workspace_command(
    command: &str,
    workspace_path: &Path,
    root_path: &Path,
    workspace_name: &str,
    default_branch: &str,
    log_path: &Path,
) -> AppResult<CommandRunResult> {
    let command = command.to_string();
    let workspace_path = workspace_path.to_path_buf();
    let root_path = root_path.to_path_buf();
    let workspace_name = workspace_name.to_string();
    let default_branch = default_branch.to_string();
    let log_path = log_path.to_path_buf();

    tauri::async_runtime::spawn_blocking(move || {
        run_workspace_command_blocking(
            &command,
            &workspace_path,
            &root_path,
            &workspace_name,
            &default_branch,
            &log_path,
        )
    })
    .await
    .map_err(|error| AppError::Internal {
        message: format!("Command task failed: {error}"),
    })?
}

fn run_workspace_command_blocking(
    command: &str,
    workspace_path: &PathBuf,
    root_path: &PathBuf,
    workspace_name: &str,
    default_branch: &str,
    log_path: &PathBuf,
) -> AppResult<CommandRunResult> {
    if command.trim().is_empty() {
        return Ok(CommandRunResult {
            exit_code: 0,
            log_path: log_path.to_string_lossy().to_string(),
        });
    }

    if let Some(parent) = log_path.parent() {
        fs::create_dir_all(parent)?;
    }

    let output = Command::new("/bin/zsh")
        .arg("-lc")
        .arg(command)
        .current_dir(workspace_path)
        .env("CONDUCTOR_WORKSPACE_NAME", workspace_name)
        .env("CONDUCTOR_WORKSPACE_PATH", workspace_path)
        .env("CONDUCTOR_ROOT_PATH", root_path)
        .env("CONDUCTOR_DEFAULT_BRANCH", default_branch)
        .env("CONDUCTOR_IS_LOCAL", "true")
        .output()?;

    let mut log = Vec::new();
    log.extend_from_slice(&output.stdout);
    log.extend_from_slice(&output.stderr);
    fs::write(log_path, log)?;

    let exit_code = output.status.code().unwrap_or(-1);
    if output.status.success() {
        Ok(CommandRunResult {
            exit_code,
            log_path: log_path.to_string_lossy().to_string(),
        })
    } else {
        Err(AppError::CommandFailed {
            message: format!("Command failed with exit code {exit_code}."),
        })
    }
}
