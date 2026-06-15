// @purpose Reads per-workspace git status metadata.
// @role    Git infrastructure adapter for refresh, archive safety, and panel display.
// @deps    std process/path, WorkspaceGitState DTO, shared errors
// @gotcha  Status values are snapshots; callers decide when to refresh and persist them.
use std::path::Path;
use std::process::Command;

use crate::shared::dto::errors::{AppError, AppResult};
use crate::shared::dto::workspaces::WorkspaceGitStateDto;

pub(crate) fn read_git_state(workspace_path: &Path) -> AppResult<WorkspaceGitStateDto> {
    Ok(WorkspaceGitStateDto {
        ahead: ahead_behind(workspace_path)
            .map(|(ahead, _)| ahead)
            .unwrap_or(0),
        behind: ahead_behind(workspace_path)
            .map(|(_, behind)| behind)
            .unwrap_or(0),
        dirty: dirty_count(workspace_path)?,
        last_commit_message: last_commit_message(workspace_path).unwrap_or_default(),
        captured_at: String::new(),
    })
}

pub(crate) fn is_dirty(workspace_path: &Path) -> AppResult<bool> {
    Ok(dirty_count(workspace_path)? > 0)
}

fn dirty_count(workspace_path: &Path) -> AppResult<i32> {
    let output = git(workspace_path, &["status", "--porcelain=v1"])?;
    Ok(output
        .lines()
        .filter(|line| !line.trim().is_empty())
        .count() as i32)
}

fn last_commit_message(workspace_path: &Path) -> AppResult<String> {
    git(workspace_path, &["log", "-1", "--pretty=%s"])
        .map(|value| value.trim().to_string())
        .or_else(|_| Ok(String::new()))
}

fn ahead_behind(workspace_path: &Path) -> AppResult<(i32, i32)> {
    let output = git(
        workspace_path,
        &["rev-list", "--left-right", "--count", "HEAD...@{upstream}"],
    )?;
    let mut parts = output.split_whitespace();
    let ahead = parts
        .next()
        .and_then(|value| value.parse().ok())
        .unwrap_or(0);
    let behind = parts
        .next()
        .and_then(|value| value.parse().ok())
        .unwrap_or(0);
    Ok((ahead, behind))
}

fn git(workspace_path: &Path, args: &[&str]) -> AppResult<String> {
    let output = Command::new("git")
        .arg("-C")
        .arg(workspace_path)
        .args(args)
        .output()?;

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    } else {
        Err(AppError::GitCommandFailed {
            message: String::from_utf8_lossy(&output.stderr).trim().to_string(),
        })
    }
}
