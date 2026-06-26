// @purpose Reads git branch/worktree metadata and prunes worktrees through git command output.
// @role    Git infrastructure adapter used by Conductor import, refresh, create, archive, and remove use cases.
// @deps    std process/path, shared errors
// @gotcha  Remote aliases like refs/remotes/origin and origin/HEAD are hidden from branch selection.
use std::path::{Path, PathBuf};
use std::process::Command;

use crate::shared::dto::errors::{AppError, AppResult};

#[derive(Debug, Clone)]
pub(crate) struct GitWorktreeEntry {
    pub path: PathBuf,
    pub branch: Option<String>,
    pub prunable: bool,
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

pub(crate) fn list_base_branches(repo_path: &Path) -> AppResult<Vec<String>> {
    let output = Command::new("git")
        .arg("-C")
        .arg(repo_path)
        .arg("for-each-ref")
        .arg("--format=%(refname)")
        .arg("refs/heads")
        .arg("refs/remotes")
        .output()?;

    if !output.status.success() {
        return Err(AppError::GitCommandFailed {
            message: String::from_utf8_lossy(&output.stderr).trim().to_string(),
        });
    }

    Ok(parse_base_branches(&String::from_utf8_lossy(
        &output.stdout,
    )))
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

pub(crate) fn prune_worktrees(root_path: &Path) -> AppResult<()> {
    let output = Command::new("git")
        .arg("-C")
        .arg(root_path)
        .arg("worktree")
        .arg("prune")
        .output()?;

    if output.status.success() {
        Ok(())
    } else {
        Err(AppError::GitCommandFailed {
            message: String::from_utf8_lossy(&output.stderr).trim().to_string(),
        })
    }
}

pub(crate) fn parse_base_branches(input: &str) -> Vec<String> {
    let mut branches = Vec::new();
    for line in input.lines() {
        let Some(branch) = parse_base_branch_ref(line.trim()) else {
            continue;
        };
        if branches.iter().any(|known| known == branch) {
            continue;
        }

        branches.push(branch.to_string());
    }
    branches
}

fn parse_base_branch_ref(value: &str) -> Option<&str> {
    if value.is_empty() {
        return None;
    }

    if let Some(branch) = value.strip_prefix("refs/heads/") {
        return Some(branch).filter(|branch| !branch.is_empty());
    }

    if let Some(branch) = value.strip_prefix("refs/remotes/") {
        return Some(branch).filter(|branch| branch.contains('/') && !branch.ends_with("/HEAD"));
    }

    Some(value).filter(|branch| !branch.ends_with("/HEAD"))
}

pub(crate) fn parse_worktree_porcelain(input: &str) -> AppResult<Vec<GitWorktreeEntry>> {
    let mut entries = Vec::new();
    let mut path: Option<PathBuf> = None;
    let mut branch: Option<String> = None;
    let mut prunable = false;

    for line in input.lines() {
        if line.is_empty() {
            if let Some(entry_path) = path.take() {
                entries.push(GitWorktreeEntry {
                    path: entry_path,
                    branch: branch.take(),
                    prunable,
                });
                prunable = false;
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
        } else if line.starts_with("prunable") {
            prunable = true;
        }
    }

    if let Some(entry_path) = path {
        entries.push(GitWorktreeEntry {
            path: entry_path,
            branch,
            prunable,
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
        assert!(!entries[0].prunable);
        assert_eq!(entries[1].branch.as_deref(), Some("feat/login"));
        assert!(!entries[1].prunable);
    }

    #[test]
    fn parses_prunable_git_worktree() {
        let output = "\
worktree /Users/me/Code/acme
HEAD abc123
branch refs/heads/main

worktree /Users/me/conductor/workspaces/acme/missing
HEAD def456
branch refs/heads/missing
prunable gitdir file points to non-existent location

";

        let entries = parse_worktree_porcelain(output).expect("porcelain should parse");
        assert_eq!(entries.len(), 2);
        assert!(!entries[0].prunable);
        assert!(entries[1].prunable);
    }

    #[test]
    fn parses_base_branches_without_remote_aliases() {
        let output = "\
refs/heads/main
refs/heads/feature/local
refs/heads/origin
refs/remotes/origin
refs/remotes/origin/HEAD
refs/remotes/origin/main
refs/remotes/origin/feature/remote
refs/remotes/upstream
refs/remotes/upstream/main
refs/remotes/origin/main

";

        assert_eq!(
            parse_base_branches(output),
            vec![
                "main".to_string(),
                "feature/local".to_string(),
                "origin".to_string(),
                "origin/main".to_string(),
                "origin/feature/remote".to_string(),
                "upstream/main".to_string()
            ]
        );
    }
}
