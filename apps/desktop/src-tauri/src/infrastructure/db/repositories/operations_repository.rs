// @purpose Writes and reads Grove operation records in SQLite.
// @role    Persistence adapter for backend workflows, locks, logs, and retry surfaces.
// @deps    sqlx, operation DTOs, shared errors
// @gotcha  Logs live on disk; operations store status and log path metadata.
use sqlx::{FromRow, SqlitePool};

use crate::shared::dto::errors::AppResult;
use crate::shared::dto::operations::{OperationDto, OperationKindDto, OperationStatusDto};

#[derive(Debug, FromRow)]
struct OperationRow {
    id: String,
    project_id: String,
    workspace_id: Option<String>,
    kind: String,
    status: String,
    started_at: String,
    finished_at: Option<String>,
    exit_code: Option<i32>,
    log_path: Option<String>,
    error_message: Option<String>,
}

pub(crate) async fn start_operation(
    pool: &SqlitePool,
    id: &str,
    project_id: &str,
    workspace_id: Option<&str>,
    kind: &str,
) -> AppResult<()> {
    sqlx::query(
        r#"
        INSERT INTO operations (id, project_id, workspace_id, kind, status)
        VALUES (?1, ?2, ?3, ?4, 'running')
        "#,
    )
    .bind(id)
    .bind(project_id)
    .bind(workspace_id)
    .bind(kind)
    .execute(pool)
    .await?;

    Ok(())
}

pub(crate) async fn finish_operation(
    pool: &SqlitePool,
    id: &str,
    status: &str,
    exit_code: Option<i32>,
    log_path: Option<&str>,
    error_message: Option<&str>,
) -> AppResult<()> {
    sqlx::query(
        r#"
        UPDATE operations
        SET status = ?2,
            finished_at = CURRENT_TIMESTAMP,
            exit_code = ?3,
            log_path = ?4,
            error_message = ?5
        WHERE id = ?1
        "#,
    )
    .bind(id)
    .bind(status)
    .bind(exit_code)
    .bind(log_path)
    .bind(error_message)
    .execute(pool)
    .await?;

    Ok(())
}

pub(crate) async fn attach_workspace(
    pool: &SqlitePool,
    id: &str,
    workspace_id: &str,
) -> AppResult<()> {
    sqlx::query("UPDATE operations SET workspace_id = ?2 WHERE id = ?1")
        .bind(id)
        .bind(workspace_id)
        .execute(pool)
        .await?;

    Ok(())
}

pub(crate) async fn latest_for_workspace(
    pool: &SqlitePool,
    workspace_id: &str,
) -> AppResult<Option<OperationDto>> {
    latest_with_clause(pool, "workspace_id = ?1", workspace_id).await
}

pub(crate) async fn latest_for_project(
    pool: &SqlitePool,
    project_id: &str,
) -> AppResult<Option<OperationDto>> {
    latest_with_clause(pool, "project_id = ?1", project_id).await
}

async fn latest_with_clause(
    pool: &SqlitePool,
    clause: &str,
    value: &str,
) -> AppResult<Option<OperationDto>> {
    let sql = format!(
        r#"
        SELECT id, project_id, workspace_id, kind, status, started_at, finished_at,
               exit_code, log_path, error_message
        FROM operations
        WHERE {clause}
        ORDER BY started_at DESC, rowid DESC
        LIMIT 1
        "#
    );
    let row = sqlx::query_as::<_, OperationRow>(&sql)
        .bind(value)
        .fetch_optional(pool)
        .await?;

    Ok(row.map(OperationRow::into_dto))
}

pub(crate) async fn get_operation(pool: &SqlitePool, id: &str) -> AppResult<OperationDto> {
    let row = sqlx::query_as::<_, OperationRow>(
        r#"
        SELECT id, project_id, workspace_id, kind, status, started_at, finished_at,
               exit_code, log_path, error_message
        FROM operations
        WHERE id = ?1
        "#,
    )
    .bind(id)
    .fetch_one(pool)
    .await?;

    Ok(row.into_dto())
}

pub(crate) async fn has_running_project_operation(
    pool: &SqlitePool,
    project_id: &str,
) -> AppResult<bool> {
    let count = sqlx::query_scalar::<_, i64>(
        r#"
        SELECT COUNT(*)
        FROM operations
        WHERE project_id = ?1 AND status = 'running'
        "#,
    )
    .bind(project_id)
    .fetch_one(pool)
    .await?;

    Ok(count > 0)
}

pub(crate) async fn has_running_project_remove_operation(
    pool: &SqlitePool,
    project_id: &str,
) -> AppResult<bool> {
    let count = sqlx::query_scalar::<_, i64>(
        r#"
        SELECT COUNT(*)
        FROM operations
        WHERE project_id = ?1 AND kind = 'remove_project' AND status = 'running'
        "#,
    )
    .bind(project_id)
    .fetch_one(pool)
    .await?;

    Ok(count > 0)
}

pub(crate) async fn has_running_workspace_operation(
    pool: &SqlitePool,
    workspace_id: &str,
) -> AppResult<bool> {
    let count = sqlx::query_scalar::<_, i64>(
        r#"
        SELECT COUNT(*)
        FROM operations
        WHERE workspace_id = ?1 AND status = 'running'
        "#,
    )
    .bind(workspace_id)
    .fetch_one(pool)
    .await?;

    Ok(count > 0)
}

impl OperationRow {
    fn into_dto(self) -> OperationDto {
        OperationDto {
            id: self.id,
            project_id: self.project_id,
            workspace_id: self.workspace_id,
            kind: parse_kind(&self.kind),
            status: parse_status(&self.status),
            started_at: self.started_at,
            finished_at: self.finished_at,
            exit_code: self.exit_code,
            log_path: self.log_path,
            error_message: self.error_message,
        }
    }
}

fn parse_kind(value: &str) -> OperationKindDto {
    match value {
        "import" => OperationKindDto::Import,
        "refresh" => OperationKindDto::Refresh,
        "setup" => OperationKindDto::Setup,
        "archive" => OperationKindDto::Archive,
        "remove_project" => OperationKindDto::RemoveProject,
        "open_editor" => OperationKindDto::OpenEditor,
        "open_terminal" => OperationKindDto::OpenTerminal,
        "reveal_finder" => OperationKindDto::RevealFinder,
        _ => OperationKindDto::Create,
    }
}

fn parse_status(value: &str) -> OperationStatusDto {
    match value {
        "queued" => OperationStatusDto::Queued,
        "succeeded" => OperationStatusDto::Succeeded,
        "failed" => OperationStatusDto::Failed,
        _ => OperationStatusDto::Running,
    }
}
