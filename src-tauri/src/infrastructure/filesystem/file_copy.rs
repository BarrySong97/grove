// @purpose Copies Conductor-compatible ignored files into a new workspace.
// @role    Filesystem adapter used after git worktree creation.
// @deps    glob, std fs/path, shared errors
// @gotcha  Pattern precedence is .worktreeinclude > config file_include_globs > default .env*.
use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;

use glob::glob;

use crate::shared::dto::errors::{AppError, AppResult};

pub(crate) fn copy_matching_files(
    root_path: &Path,
    workspace_path: &Path,
    config_patterns: &[String],
) -> AppResult<()> {
    let patterns = read_patterns(root_path, config_patterns)?;
    for pattern in patterns {
        for source in matching_sources(root_path, &pattern)? {
            if !is_gitignored(root_path, &source)? {
                continue;
            }
            let relative = source
                .strip_prefix(root_path)
                .map_err(|_| AppError::Internal {
                    message: format!("Unable to derive relative path for {}", source.display()),
                })?;
            let target = workspace_path.join(relative);
            if let Some(parent) = target.parent() {
                fs::create_dir_all(parent)?;
            }
            fs::copy(&source, target)?;
        }
    }
    Ok(())
}

fn read_patterns(root_path: &Path, config_patterns: &[String]) -> AppResult<Vec<String>> {
    let include = root_path.join(".worktreeinclude");
    if include.exists() {
        let content = fs::read_to_string(include)?;
        let patterns = content
            .lines()
            .map(str::trim)
            .filter(|line| !line.is_empty() && !line.starts_with('#'))
            .map(str::to_string)
            .collect();
        return Ok(patterns);
    }
    if !config_patterns.is_empty() {
        return Ok(config_patterns.to_vec());
    }
    Ok(vec![".env*".into()])
}

fn matching_sources(root_path: &Path, pattern: &str) -> AppResult<Vec<PathBuf>> {
    if pattern == ".env*" {
        let mut matches = Vec::new();
        for entry in fs::read_dir(root_path)? {
            let entry = entry?;
            let path = entry.path();
            if path
                .file_name()
                .and_then(|value| value.to_str())
                .is_some_and(|name| name.starts_with(".env"))
            {
                matches.push(path);
            }
        }
        return Ok(matches);
    }

    let pattern = root_path.join(pattern).to_string_lossy().to_string();
    let mut matches = Vec::new();
    for entry in glob(&pattern).map_err(|error| AppError::Internal {
        message: format!("Invalid file include glob: {error}"),
    })? {
        let path = entry.map_err(|error| AppError::Internal {
            message: format!("Failed to expand file include glob: {error}"),
        })?;
        if path.is_file() {
            matches.push(path);
        }
    }
    Ok(matches)
}

fn is_gitignored(root_path: &Path, path: &Path) -> AppResult<bool> {
    let output = Command::new("git")
        .arg("-C")
        .arg(root_path)
        .arg("check-ignore")
        .arg(path)
        .output()?;

    Ok(output.status.success())
}
