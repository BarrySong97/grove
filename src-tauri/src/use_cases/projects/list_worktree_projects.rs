// @purpose Lists projects with commands and workspaces for the Worktree panel.
// @role    Read-only panel use case for replacing frontend mock project state.
// @deps    project/workspace repositories, WorktreeProject DTO, shared errors
// @gotcha  This uses persisted state; live git refresh is a separate use case.
use sqlx::SqlitePool;

use crate::infrastructure::db::repositories::{projects_repository, workspaces_repository};
use crate::shared::dto::errors::AppResult;
use crate::shared::dto::projects::WorktreeProjectDto;

pub(crate) async fn run(pool: &SqlitePool) -> AppResult<Vec<WorktreeProjectDto>> {
    let projects = projects_repository::list_projects(pool).await?;
    let mut panel_projects = Vec::with_capacity(projects.len());

    for project in projects {
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
