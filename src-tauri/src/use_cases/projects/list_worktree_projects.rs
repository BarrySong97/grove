// @purpose Lists projects with commands and workspaces for the Worktree panel.
// @role    Read-only panel use case for replacing frontend mock project state.
// @deps    Conductor config reader, project/workspace repositories, WorktreeProject DTO, shared errors
// @gotcha  Re-syncs setup/archive from conductor.json/settings on each load (preserving grove_override edits); live git refresh is a separate use case.
use std::path::PathBuf;

use sqlx::SqlitePool;

use crate::infrastructure::conductor::config_repository;
use crate::infrastructure::db::repositories::{projects_repository, workspaces_repository};
use crate::shared::dto::errors::AppResult;
use crate::shared::dto::projects::{ProjectDto, WorktreeProjectDto};

pub(crate) async fn run(pool: &SqlitePool) -> AppResult<Vec<WorktreeProjectDto>> {
    let projects = projects_repository::list_projects(pool).await?;
    let mut panel_projects = Vec::with_capacity(projects.len());

    for project in projects {
        sync_conductor_commands(pool, &project).await?;
        let commands = projects_repository::get_project_commands(pool, &project.id).await?;
        let workspaces = workspaces_repository::list_project_workspaces(pool, &project.id).await?;
        panel_projects.push(WorktreeProjectDto {
            project,
            commands,
            workspaces,
        });
    }

    Ok(panel_projects)
}

/// Re-reads the project's Conductor config and backfills setup/archive/run
/// commands so existing projects pick up conductor.json without re-importing.
/// Grove overrides are preserved by `upsert_config_command`. Config read
/// failures are ignored so a malformed file never blocks the panel.
async fn sync_conductor_commands(pool: &SqlitePool, project: &ProjectDto) -> AppResult<()> {
    let root = PathBuf::from(&project.root_path);
    let Ok(config) = config_repository::read_project_config(&root) else {
        return Ok(());
    };

    for (kind, command) in [
        ("setup", &config.setup_command),
        ("archive", &config.archive_command),
        ("run", &config.run_command),
    ] {
        if let Some(command) = command {
            projects_repository::upsert_config_command(pool, &project.id, kind, command).await?;
        }
    }

    Ok(())
}
