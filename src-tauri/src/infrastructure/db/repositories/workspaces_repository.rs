// @purpose Reads, writes, and removes Grove workspace records in SQLite.
// @role    Persistence adapter used by import, refresh, archive, and project removal use cases.
// @deps    sqlx, workspace DTOs, shared errors
// @gotcha  Workspace rows cache Grove state; git status refresh owns live metadata.
use sqlx::{FromRow, QueryBuilder, Sqlite, SqlitePool};

use crate::shared::dto::errors::AppResult;
use crate::shared::dto::workspaces::{
    WorkspaceDto, WorkspaceGitStateDto, WorkspaceLifecycleStatusDto, WorkspaceOperationStatusDto,
};

pub(crate) async fn upsert_workspace(pool: &SqlitePool, workspace: &WorkspaceDto) -> AppResult<()> {
    sqlx::query(
        r#"
        INSERT INTO workspaces (
            id, project_id, name, branch, base_branch, path, lifecycle_status, operation_status,
            hidden_at, stale_at, last_seen_at
        )
        VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, CURRENT_TIMESTAMP)
        ON CONFLICT(id) DO UPDATE SET
            project_id = excluded.project_id,
            name = excluded.name,
            branch = excluded.branch,
            base_branch = excluded.base_branch,
            path = excluded.path,
            lifecycle_status = excluded.lifecycle_status,
            operation_status = excluded.operation_status,
            hidden_at = excluded.hidden_at,
            stale_at = excluded.stale_at,
            last_seen_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        "#,
    )
    .bind(&workspace.id)
    .bind(&workspace.project_id)
    .bind(&workspace.name)
    .bind(&workspace.branch)
    .bind(&workspace.base_branch)
    .bind(&workspace.path)
    .bind(format_lifecycle_status(&workspace.lifecycle_status))
    .bind(format_operation_status(&workspace.operation_status))
    .bind(&workspace.hidden_at)
    .bind(&workspace.stale_at)
    .execute(pool)
    .await?;

    Ok(())
}

pub(crate) async fn get_workspace(
    pool: &SqlitePool,
    workspace_id: &str,
) -> AppResult<WorkspaceDto> {
    let row = sqlx::query_as::<_, WorkspaceRow>(
        r#"
        SELECT
            w.id, w.project_id, w.name, w.branch, w.base_branch, w.path,
            w.lifecycle_status, w.operation_status, w.hidden_at, w.stale_at,
            g.ahead, g.behind, g.dirty, g.last_commit_message, g.captured_at
        FROM workspaces w
        LEFT JOIN workspace_git_state g ON g.workspace_id = w.id
        WHERE w.id = ?1
        "#,
    )
    .bind(workspace_id)
    .fetch_one(pool)
    .await?;

    Ok(row.into_dto())
}

pub(crate) async fn list_project_workspaces(
    pool: &SqlitePool,
    project_id: &str,
) -> AppResult<Vec<WorkspaceDto>> {
    let rows = sqlx::query_as::<_, WorkspaceRow>(
        r#"
        SELECT
            w.id, w.project_id, w.name, w.branch, w.base_branch, w.path,
            w.lifecycle_status, w.operation_status, w.hidden_at, w.stale_at,
            g.ahead, g.behind, g.dirty, g.last_commit_message, g.captured_at
        FROM workspaces w
        LEFT JOIN workspace_git_state g ON g.workspace_id = w.id
        WHERE w.project_id = ?1
        ORDER BY w.name COLLATE NOCASE ASC
        "#,
    )
    .bind(project_id)
    .fetch_all(pool)
    .await?;

    Ok(rows.into_iter().map(WorkspaceRow::into_dto).collect())
}

pub(crate) async fn list_active_project_workspaces(
    pool: &SqlitePool,
    project_id: &str,
) -> AppResult<Vec<WorkspaceDto>> {
    let rows = sqlx::query_as::<_, WorkspaceRow>(
        r#"
        SELECT
            w.id, w.project_id, w.name, w.branch, w.base_branch, w.path,
            w.lifecycle_status, w.operation_status, w.hidden_at, w.stale_at,
            g.ahead, g.behind, g.dirty, g.last_commit_message, g.captured_at
        FROM workspaces w
        LEFT JOIN workspace_git_state g ON g.workspace_id = w.id
        WHERE w.project_id = ?1 AND w.lifecycle_status = 'active'
        ORDER BY w.path COLLATE NOCASE ASC
        "#,
    )
    .bind(project_id)
    .fetch_all(pool)
    .await?;

    Ok(rows.into_iter().map(WorkspaceRow::into_dto).collect())
}

pub(crate) async fn update_operation_status(
    pool: &SqlitePool,
    workspace_id: &str,
    status: &str,
) -> AppResult<()> {
    sqlx::query(
        r#"
        UPDATE workspaces
        SET operation_status = ?2, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?1
        "#,
    )
    .bind(workspace_id)
    .bind(status)
    .execute(pool)
    .await?;

    Ok(())
}

pub(crate) async fn mark_project_workspaces_stale_except(
    pool: &SqlitePool,
    project_id: &str,
    active_workspace_ids: &[String],
) -> AppResult<()> {
    let mut builder = QueryBuilder::<Sqlite>::new(
        r#"
        UPDATE workspaces
        SET lifecycle_status = 'stale',
            stale_at = COALESCE(stale_at, CURRENT_TIMESTAMP),
            operation_status = 'idle',
            updated_at = CURRENT_TIMESTAMP
        WHERE project_id =
        "#,
    );
    builder.push_bind(project_id);
    builder.push(" AND lifecycle_status = 'active'");

    if !active_workspace_ids.is_empty() {
        builder.push(" AND id NOT IN (");
        let mut separated = builder.separated(", ");
        for id in active_workspace_ids {
            separated.push_bind(id);
        }
        separated.push_unseparated(")");
    }

    builder.build().execute(pool).await?;
    Ok(())
}

pub(crate) async fn hide_workspace(pool: &SqlitePool, workspace_id: &str) -> AppResult<()> {
    sqlx::query(
        r#"
        UPDATE workspaces
        SET lifecycle_status = 'hidden',
            hidden_at = CURRENT_TIMESTAMP,
            operation_status = 'idle',
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?1
        "#,
    )
    .bind(workspace_id)
    .execute(pool)
    .await?;

    Ok(())
}

pub(crate) async fn upsert_git_state(
    pool: &SqlitePool,
    workspace_id: &str,
    state: &WorkspaceGitStateDto,
) -> AppResult<()> {
    sqlx::query(
        r#"
        INSERT INTO workspace_git_state (
            workspace_id, ahead, behind, dirty, last_commit_message, captured_at
        )
        VALUES (?1, ?2, ?3, ?4, ?5, CURRENT_TIMESTAMP)
        ON CONFLICT(workspace_id) DO UPDATE SET
            ahead = excluded.ahead,
            behind = excluded.behind,
            dirty = excluded.dirty,
            last_commit_message = excluded.last_commit_message,
            captured_at = CURRENT_TIMESTAMP
        "#,
    )
    .bind(workspace_id)
    .bind(state.ahead)
    .bind(state.behind)
    .bind(state.dirty)
    .bind(&state.last_commit_message)
    .execute(pool)
    .await?;

    Ok(())
}

#[derive(Debug, FromRow)]
struct WorkspaceRow {
    id: String,
    project_id: String,
    name: String,
    branch: String,
    base_branch: Option<String>,
    path: String,
    lifecycle_status: String,
    operation_status: String,
    hidden_at: Option<String>,
    stale_at: Option<String>,
    ahead: Option<i32>,
    behind: Option<i32>,
    dirty: Option<i32>,
    last_commit_message: Option<String>,
    captured_at: Option<String>,
}

impl WorkspaceRow {
    fn into_dto(self) -> WorkspaceDto {
        let git_state = self.captured_at.map(|captured_at| WorkspaceGitStateDto {
            ahead: self.ahead.unwrap_or_default(),
            behind: self.behind.unwrap_or_default(),
            dirty: self.dirty.unwrap_or_default(),
            last_commit_message: self.last_commit_message.unwrap_or_default(),
            captured_at,
        });

        WorkspaceDto {
            id: self.id,
            project_id: self.project_id,
            name: self.name,
            branch: self.branch,
            base_branch: self.base_branch,
            path: self.path,
            lifecycle_status: parse_lifecycle_status(&self.lifecycle_status),
            operation_status: parse_operation_status(&self.operation_status),
            hidden_at: self.hidden_at,
            stale_at: self.stale_at,
            git_state,
        }
    }
}

fn parse_lifecycle_status(value: &str) -> WorkspaceLifecycleStatusDto {
    match value {
        "hidden" => WorkspaceLifecycleStatusDto::Hidden,
        "stale" => WorkspaceLifecycleStatusDto::Stale,
        _ => WorkspaceLifecycleStatusDto::Active,
    }
}

fn parse_operation_status(value: &str) -> WorkspaceOperationStatusDto {
    match value {
        "creating" => WorkspaceOperationStatusDto::Creating,
        "setting_up" => WorkspaceOperationStatusDto::SettingUp,
        "archiving" => WorkspaceOperationStatusDto::Archiving,
        "failed" => WorkspaceOperationStatusDto::Failed,
        _ => WorkspaceOperationStatusDto::Idle,
    }
}

fn format_lifecycle_status(value: &WorkspaceLifecycleStatusDto) -> &'static str {
    match value {
        WorkspaceLifecycleStatusDto::Active => "active",
        WorkspaceLifecycleStatusDto::Hidden => "hidden",
        WorkspaceLifecycleStatusDto::Stale => "stale",
    }
}

fn format_operation_status(value: &WorkspaceOperationStatusDto) -> &'static str {
    match value {
        WorkspaceOperationStatusDto::Idle => "idle",
        WorkspaceOperationStatusDto::Creating => "creating",
        WorkspaceOperationStatusDto::SettingUp => "setting_up",
        WorkspaceOperationStatusDto::Archiving => "archiving",
        WorkspaceOperationStatusDto::Failed => "failed",
    }
}
