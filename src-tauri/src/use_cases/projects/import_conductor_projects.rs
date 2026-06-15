// @purpose Imports existing Conductor-style git worktree projects into Grove state.
// @role    Project use case for read-only Conductor workspace discovery and persistence.
// @deps    Conductor path rules/config reader, git worktree repository, SQLite repositories, DTOs
// @gotcha  Import must not move, modify, setup, archive, or delete existing workspaces.
use std::collections::{hash_map::DefaultHasher, HashSet};
use std::fs;
use std::hash::{Hash, Hasher};
use std::path::{Path, PathBuf};

use sqlx::SqlitePool;

use crate::domain::conductor::workspace_paths;
use crate::infrastructure::conductor::config_repository;
use crate::infrastructure::db::repositories::{projects_repository, workspaces_repository};
use crate::infrastructure::git::worktree_repository::{self, GitWorktreeEntry};
use crate::shared::dto::conductor::{ConductorImportCandidateDto, ImportConductorProjectsInput};
use crate::shared::dto::errors::{AppError, AppResult};
use crate::shared::dto::projects::{ArchivePolicyDto, ConfigSourceDto, ProjectDto};
use crate::shared::dto::workspaces::{
    WorkspaceDto, WorkspaceLifecycleStatusDto, WorkspaceOperationStatusDto,
};

pub(crate) async fn run(
    pool: &SqlitePool,
    input: ImportConductorProjectsInput,
) -> AppResult<Vec<ConductorImportCandidateDto>> {
    let workspace_root = resolve_workspace_root(input.workspace_root)?;
    if !workspace_root.exists() {
        return Ok(Vec::new());
    }

    let mut candidates = Vec::new();
    let mut imported_roots = HashSet::new();

    for repo_entry in fs::read_dir(&workspace_root)? {
        let repo_entry = repo_entry?;
        let repo_workspace_root = repo_entry.path();
        if !repo_workspace_root.is_dir() {
            continue;
        }

        for workspace_entry in fs::read_dir(&repo_workspace_root)? {
            let workspace_entry = workspace_entry?;
            let workspace_path = workspace_entry.path();
            if !workspace_path.is_dir() {
                continue;
            }

            let worktrees = match worktree_repository::list_worktrees(&workspace_path) {
                Ok(worktrees) => worktrees,
                Err(_) => continue,
            };
            let root_path = infer_project_root(&worktrees, &repo_workspace_root);
            let root_key = root_path.to_string_lossy().to_string();
            if !imported_roots.insert(root_key.clone()) {
                continue;
            }

            let project = build_project(&root_path, &repo_workspace_root, &worktrees)?;
            let config = config_repository::read_project_config(&root_path)?;
            let project = ProjectDto {
                config_source: config.source.clone(),
                ..project
            };
            let workspaces = build_workspaces(&project, &worktrees, &repo_workspace_root);

            projects_repository::upsert_project(pool, &project).await?;
            persist_commands(pool, &project.id, &config).await?;
            let mut active_workspace_ids = Vec::new();
            for workspace in &workspaces {
                active_workspace_ids.push(workspace.id.clone());
                workspaces_repository::upsert_workspace(pool, workspace).await?;
            }
            workspaces_repository::mark_project_workspaces_stale_except(
                pool,
                &project.id,
                &active_workspace_ids,
            )
            .await?;

            candidates.push(ConductorImportCandidateDto {
                repo_name: project.name.clone(),
                root_path: project.root_path.clone(),
                workspace_root: project.workspace_root.clone(),
                config_source: project.config_source.clone(),
                workspaces,
                warnings: Vec::new(),
            });
        }
    }

    Ok(candidates)
}

fn resolve_workspace_root(input: Option<String>) -> AppResult<PathBuf> {
    let root = input
        .map(PathBuf::from)
        .map(Ok)
        .or_else(|| config_repository::read_user_workspace_root().transpose())
        .transpose()?
        .or_else(workspace_paths::default_workspace_root)
        .ok_or(AppError::InvalidRepo {
            message: "Unable to resolve the Conductor workspace root.".into(),
        })?;
    Ok(root.canonicalize().unwrap_or(root))
}

fn infer_project_root(worktrees: &[GitWorktreeEntry], repo_workspace_root: &Path) -> PathBuf {
    worktrees
        .iter()
        .find(|entry| !entry.path.starts_with(repo_workspace_root))
        .or_else(|| worktrees.first())
        .map(|entry| entry.path.clone())
        .unwrap_or_else(|| repo_workspace_root.to_path_buf())
}

fn build_project(
    root_path: &Path,
    repo_workspace_root: &Path,
    worktrees: &[GitWorktreeEntry],
) -> AppResult<ProjectDto> {
    let name = root_path
        .file_name()
        .and_then(|value| value.to_str())
        .ok_or_else(|| AppError::InvalidRepo {
            message: format!("Unable to infer project name for {}", root_path.display()),
        })?
        .to_string();
    let default_branch = worktrees
        .iter()
        .find(|entry| entry.path == root_path)
        .and_then(|entry| entry.branch.clone())
        .unwrap_or_else(|| "main".into());

    Ok(ProjectDto {
        id: stable_id(&root_path.to_string_lossy()),
        name,
        root_path: root_path.to_string_lossy().to_string(),
        workspace_root: repo_workspace_root.to_string_lossy().to_string(),
        default_branch,
        config_source: ConfigSourceDto::None,
        archive_policy: ArchivePolicyDto::Ask,
    })
}

fn build_workspaces(
    project: &ProjectDto,
    worktrees: &[GitWorktreeEntry],
    repo_workspace_root: &Path,
) -> Vec<WorkspaceDto> {
    worktrees
        .iter()
        .filter(|entry| entry.path.starts_with(repo_workspace_root))
        .map(|entry| {
            let name = entry
                .path
                .file_name()
                .and_then(|value| value.to_str())
                .unwrap_or("workspace")
                .to_string();
            let branch = entry.branch.clone().unwrap_or_else(|| name.clone());
            WorkspaceDto {
                id: stable_id(&entry.path.to_string_lossy()),
                project_id: project.id.clone(),
                name,
                branch,
                base_branch: Some(project.default_branch.clone()),
                path: entry.path.to_string_lossy().to_string(),
                lifecycle_status: WorkspaceLifecycleStatusDto::Active,
                operation_status: WorkspaceOperationStatusDto::Idle,
                hidden_at: None,
                stale_at: None,
                git_state: None,
            }
        })
        .collect()
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
