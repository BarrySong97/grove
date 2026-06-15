// @purpose Runs user-configured setup/archive commands with Conductor-compatible environment.
// @role    Process adapter used by create and archive workspace use cases.
// @deps    std process/fs/path, shared errors
// @gotcha  Command text is user-authored; paths and env are passed separately from shell text.
use std::fs;
use std::path::Path;
use std::process::Command;

use crate::shared::dto::errors::{AppError, AppResult};

pub(crate) struct CommandRunResult {
    pub exit_code: i32,
    pub log_path: String,
}

pub(crate) fn run_workspace_command(
    command: &str,
    workspace_path: &Path,
    root_path: &Path,
    workspace_name: &str,
    default_branch: &str,
    log_path: &Path,
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
