// @purpose Lists Grove projects from local persistence.
// @role    Read-only project use case called by the Tauri command layer.
// @deps    projects repository, Project DTOs, shared errors
// @gotcha  This returns registered projects only; git refresh belongs in a separate use case.
use sqlx::SqlitePool;

use crate::infrastructure::db::repositories::projects_repository;
use crate::shared::dto::errors::AppResult;
use crate::shared::dto::projects::ProjectDto;

pub(crate) async fn run(pool: &SqlitePool) -> AppResult<Vec<ProjectDto>> {
    projects_repository::list_projects(pool).await
}
