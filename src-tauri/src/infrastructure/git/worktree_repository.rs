// @purpose Reads git worktree metadata through git command output.
// @role    Git infrastructure adapter used by Conductor import and refresh use cases.
// @deps    std process/path, shared errors
// @gotcha  remove_worktree uses --force only after use cases have rejected dirty workspaces.
use std::path::{Path, PathBuf};
use std::process::Command;

use crate::shared::dto::errors::{AppError, AppResult};

#[derive(Debug, Clone)]
pub(crate) struct GitWorktreeEntry {
    pub path: PathBuf,
    pub branch: Option<String>,
}

pub(crate) fn list_worktrees(repo_path: &Path) -> AppResult<Vec<GitWorktreeEntry>> {
    let output = Command::new("git")
        .arg("-C")
        .arg(repo_path)
        .arg("worktree")
        .arg("list")
        .arg("--porcelain")
        .output()?;

    if !output.status.success() {
        return Err(AppError::GitCommandFailed {
            message: String::from_utf8_lossy(&output.stderr).trim().to_string(),
        });
    }

    parse_worktree_porcelain(&String::from_utf8_lossy(&output.stdout))
}

pub(crate) fn add_worktree(
    root_path: &Path,
    workspace_path: &Path,
    branch: &str,
    base_branch: &str,
) -> AppResult<()> {
    let output = Command::new("git")
        .arg("-C")
        .arg(root_path)
        .arg("worktree")
        .arg("add")
        .arg("-b")
        .arg(branch)
        .arg(workspace_path)
        .arg(base_branch)
        .output()?;

    if output.status.success() {
        Ok(())
    } else {
        Err(AppError::GitCommandFailed {
            message: String::from_utf8_lossy(&output.stderr).trim().to_string(),
        })
    }
}

pub(crate) fn remove_worktree(root_path: &Path, workspace_path: &Path) -> AppResult<()> {
    let output = Command::new("git")
        .arg("-C")
        .arg(root_path)
        .arg("worktree")
        .arg("remove")
        .arg("--force")
        .arg(workspace_path)
        .output()?;

    if output.status.success() {
        Ok(())
    } else {
        Err(AppError::GitCommandFailed {
            message: String::from_utf8_lossy(&output.stderr).trim().to_string(),
        })
    }
}

pub(crate) fn parse_worktree_porcelain(input: &str) -> AppResult<Vec<GitWorktreeEntry>> {
    let mut entries = Vec::new();
    let mut path: Option<PathBuf> = None;
    let mut branch: Option<String> = None;

    for line in input.lines() {
        if line.is_empty() {
            if let Some(entry_path) = path.take() {
                entries.push(GitWorktreeEntry {
                    path: entry_path,
                    branch: branch.take(),
                });
            }
            continue;
        }

        if let Some(value) = line.strip_prefix("worktree ") {
            path = Some(PathBuf::from(value));
        } else if let Some(value) = line.strip_prefix("branch ") {
            branch = Some(
                value
                    .strip_prefix("refs/heads/")
                    .unwrap_or(value)
                    .to_string(),
            );
        }
    }

    if let Some(entry_path) = path {
        entries.push(GitWorktreeEntry {
            path: entry_path,
            branch,
        });
    }

    if entries.is_empty() {
        return Err(AppError::InvalidRepo {
            message: "No git worktrees were found for this repository.".into(),
        });
    }

    Ok(entries)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_git_worktree_porcelain() {
        let output = "\
worktree /Users/me/Code/acme
HEAD abc123
branch refs/heads/main

worktree /Users/me/conductor/workspaces/acme/feat-login
HEAD def456
branch refs/heads/feat/login

";

        let entries = parse_worktree_porcelain(output).expect("porcelain should parse");
        assert_eq!(entries.len(), 2);
        assert_eq!(entries[0].path, PathBuf::from("/Users/me/Code/acme"));
        assert_eq!(entries[0].branch.as_deref(), Some("main"));
        assert_eq!(entries[1].branch.as_deref(), Some("feat/login"));
    }
}
