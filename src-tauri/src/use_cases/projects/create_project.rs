// @purpose Registers a git repository as a Grove project.
// @role    Project use case for manual Add project folder selection.
// @deps    Conductor path/config readers, git worktree repository, project repository, DTOs
// @gotcha  This records Grove project state only; it does not create git worktrees.
use std::collections::hash_map::DefaultHasher;
use std::hash::{Hash, Hasher};
use std::path::{Path, PathBuf};

use sqlx::SqlitePool;

use crate::domain::conductor::workspace_paths;
use crate::infrastructure::conductor::config_repository;
use crate::infrastructure::db::repositories::projects_repository;
use crate::infrastructure::git::worktree_repository;
use crate::shared::dto::errors::{AppError, AppResult};
use crate::shared::dto::projects::{ArchivePolicyDto, CreateProjectInput, ProjectDto};

pub(crate) async fn run(pool: &SqlitePool, input: CreateProjectInput) -> AppResult<ProjectDto> {
    let root_path = resolve_repo_root(&input.root_path)?;
    let worktrees = worktree_repository::list_worktrees(&root_path)?;
    let config = config_repository::read_project_config(&root_path)?;
    let project = ProjectDto {
        id: stable_id(&root_path.to_string_lossy()),
        name: infer_project_name(&root_path)?,
        root_path: root_path.to_string_lossy().to_string(),
        workspace_root: default_workspace_root(&root_path)?,
        default_branch: worktrees
            .iter()
            .find(|entry| entry.path == root_path)
            .and_then(|entry| entry.branch.clone())
            .or_else(|| worktrees.first().and_then(|entry| entry.branch.clone()))
            .unwrap_or_else(|| "main".into()),
        config_source: config.source.clone(),
        archive_policy: ArchivePolicyDto::Ask,
    };

    projects_repository::upsert_project(pool, &project).await?;
    persist_commands(pool, &project.id, &config).await?;
    projects_repository::get_project(pool, &project.id).await
}

fn resolve_repo_root(value: &str) -> AppResult<PathBuf> {
    let path = PathBuf::from(value.trim());
    if path.as_os_str().is_empty() || !path.is_absolute() {
        return Err(AppError::InvalidRepo {
            message: "Project folder must be an absolute path.".into(),
        });
    }
    if !path.is_dir() {
        return Err(AppError::InvalidRepo {
            message: format!("Project folder does not exist: {}", path.display()),
        });
    }
    Ok(path.canonicalize().unwrap_or(path))
}

fn infer_project_name(root_path: &Path) -> AppResult<String> {
    root_path
        .file_name()
        .and_then(|value| value.to_str())
        .filter(|value| !value.trim().is_empty())
        .map(str::to_string)
        .ok_or_else(|| AppError::InvalidRepo {
            message: format!("Unable to infer project name for {}", root_path.display()),
        })
}

fn default_workspace_root(root_path: &Path) -> AppResult<String> {
    let project_name = infer_project_name(root_path)?;
    let base = config_repository::read_user_workspace_root()?
        .or_else(workspace_paths::default_workspace_root)
        .ok_or(AppError::InvalidRepo {
            message: "Unable to resolve the default workspace root.".into(),
        })?;
    Ok(base.join(project_name).to_string_lossy().to_string())
}

async fn persist_commands(
    pool: &SqlitePool,
    project_id: &str,
    config: &config_repository::ResolvedProjectConfig,
) -> AppResult<()> {
    if let Some(command) = &config.setup_command {
        projects_repository::upsert_project_command(
            pool,
            project_id,
            "setup",
            command,
            "conductor",
        )
        .await?;
    }
    if let Some(command) = &config.archive_command {
        projects_repository::upsert_project_command(
            pool,
            project_id,
            "archive",
            command,
            "conductor",
        )
        .await?;
    }
    if let Some(command) = &config.run_command {
        projects_repository::upsert_project_command(pool, project_id, "run", command, "conductor")
            .await?;
    }
    Ok(())
}

fn stable_id(value: &str) -> String {
    let mut hasher = DefaultHasher::new();
    value.hash(&mut hasher);
    format!("{:016x}", hasher.finish())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn rejects_relative_project_folder() {
        assert!(resolve_repo_root("relative/repo").is_err());
    }
}
