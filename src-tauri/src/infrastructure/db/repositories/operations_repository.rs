// @purpose Writes Grove operation records in SQLite.
// @role    Persistence adapter for long-running backend workflows.
// @deps    sqlx, shared errors
// @gotcha  Logs live on disk; operations store status and log path metadata.
use sqlx::SqlitePool;

use crate::shared::dto::errors::AppResult;

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
