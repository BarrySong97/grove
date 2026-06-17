// @purpose Reads and writes Grove project records in SQLite.
// @role    Persistence adapter used by project use cases.
// @deps    sqlx, Project DTOs, shared errors
// @gotcha  Project lists are newest registration first; rows cache Grove state, not live git state.
use sqlx::{FromRow, SqlitePool};

use crate::shared::dto::errors::AppResult;
use crate::shared::dto::projects::{
    ArchivePolicyDto, ConfigSourceDto, ProjectCommandsDto, ProjectDto,
};

#[derive(Debug, FromRow)]
struct ProjectRow {
    id: String,
    name: String,
    root_path: String,
    workspace_root: String,
    default_branch: String,
    config_source: String,
    archive_policy: String,
}

#[derive(Debug, FromRow)]
struct CommandRow {
    kind: String,
    command: String,
}

pub(crate) async fn list_projects(pool: &SqlitePool) -> AppResult<Vec<ProjectDto>> {
    let rows = sqlx::query_as::<_, ProjectRow>(
        r#"
        SELECT id, name, root_path, workspace_root, default_branch, config_source, archive_policy
        FROM projects
        ORDER BY created_at DESC, rowid DESC, name COLLATE NOCASE ASC
        "#,
    )
    .fetch_all(pool)
    .await?;

    Ok(rows.into_iter().map(ProjectRow::into_dto).collect())
}

pub(crate) async fn get_project(pool: &SqlitePool, project_id: &str) -> AppResult<ProjectDto> {
    let row = sqlx::query_as::<_, ProjectRow>(
        r#"
        SELECT id, name, root_path, workspace_root, default_branch, config_source, archive_policy
        FROM projects
        WHERE id = ?1
        "#,
    )
    .bind(project_id)
    .fetch_one(pool)
    .await?;

    Ok(row.into_dto())
}

pub(crate) async fn upsert_project(pool: &SqlitePool, project: &ProjectDto) -> AppResult<()> {
    sqlx::query(
        r#"
        INSERT INTO projects (
            id, name, root_path, workspace_root, default_branch, config_source, archive_policy
        )
        VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
        ON CONFLICT(id) DO UPDATE SET
            name = excluded.name,
            root_path = excluded.root_path,
            workspace_root = excluded.workspace_root,
            default_branch = excluded.default_branch,
            config_source = excluded.config_source,
            archive_policy = excluded.archive_policy,
            updated_at = CURRENT_TIMESTAMP
        "#,
    )
    .bind(&project.id)
    .bind(&project.name)
    .bind(&project.root_path)
    .bind(&project.workspace_root)
    .bind(&project.default_branch)
    .bind(format_config_source(&project.config_source))
    .bind(format_archive_policy(&project.archive_policy))
    .execute(pool)
    .await?;

    Ok(())
}

pub(crate) async fn upsert_project_command(
    pool: &SqlitePool,
    project_id: &str,
    kind: &str,
    command: &str,
    source: &str,
) -> AppResult<()> {
    sqlx::query(
        r#"
        INSERT INTO project_commands (project_id, kind, command, source, enabled)
        VALUES (?1, ?2, ?3, ?4, 1)
        ON CONFLICT(project_id, kind) DO UPDATE SET
            command = excluded.command,
            source = excluded.source,
            enabled = excluded.enabled
        "#,
    )
    .bind(project_id)
    .bind(kind)
    .bind(command)
    .bind(source)
    .execute(pool)
    .await?;

    Ok(())
}

pub(crate) async fn update_project_settings(
    pool: &SqlitePool,
    project_id: &str,
    workspace_root: &str,
    archive_policy: &ArchivePolicyDto,
) -> AppResult<()> {
    sqlx::query(
        r#"
        UPDATE projects
        SET workspace_root = ?2,
            archive_policy = ?3,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?1
        "#,
    )
    .bind(project_id)
    .bind(workspace_root)
    .bind(format_archive_policy(archive_policy))
    .execute(pool)
    .await?;

    Ok(())
}

pub(crate) async fn get_project_commands(
    pool: &SqlitePool,
    project_id: &str,
) -> AppResult<ProjectCommandsDto> {
    let rows = sqlx::query_as::<_, CommandRow>(
        r#"
        SELECT kind, command
        FROM project_commands
        WHERE project_id = ?1 AND enabled = 1
        "#,
    )
    .bind(project_id)
    .fetch_all(pool)
    .await?;

    let mut commands = ProjectCommandsDto {
        run: String::new(),
        setup: String::new(),
        archive: String::new(),
    };

    for row in rows {
        match row.kind.as_str() {
            "run" => commands.run = row.command,
            "setup" => commands.setup = row.command,
            "archive" => commands.archive = row.command,
            _ => {}
        }
    }

    Ok(commands)
}

pub(crate) async fn set_archive_policy(
    pool: &SqlitePool,
    project_id: &str,
    policy: &ArchivePolicyDto,
) -> AppResult<()> {
    sqlx::query(
        r#"
        UPDATE projects
        SET archive_policy = ?2, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?1
        "#,
    )
    .bind(project_id)
    .bind(format_archive_policy(policy))
    .execute(pool)
    .await?;

    Ok(())
}

impl ProjectRow {
    fn into_dto(self) -> ProjectDto {
        ProjectDto {
            id: self.id,
            name: self.name,
            root_path: self.root_path,
            workspace_root: self.workspace_root,
            default_branch: self.default_branch,
            config_source: parse_config_source(&self.config_source),
            archive_policy: parse_archive_policy(&self.archive_policy),
        }
    }
}

fn parse_config_source(value: &str) -> ConfigSourceDto {
    match value {
        "conductor_settings" => ConfigSourceDto::ConductorSettings,
        "conductor_json" => ConfigSourceDto::ConductorJson,
        "grove_override" => ConfigSourceDto::GroveOverride,
        _ => ConfigSourceDto::None,
    }
}

fn parse_archive_policy(value: &str) -> ArchivePolicyDto {
    match value {
        "hide" => ArchivePolicyDto::Hide,
        "remove_worktree" => ArchivePolicyDto::RemoveWorktree,
        _ => ArchivePolicyDto::Ask,
    }
}

fn format_config_source(value: &ConfigSourceDto) -> &'static str {
    match value {
        ConfigSourceDto::ConductorSettings => "conductor_settings",
        ConfigSourceDto::ConductorJson => "conductor_json",
        ConfigSourceDto::GroveOverride => "grove_override",
        ConfigSourceDto::None => "none",
    }
}

fn format_archive_policy(value: &ArchivePolicyDto) -> &'static str {
    match value {
        ArchivePolicyDto::Ask => "ask",
        ArchivePolicyDto::Hide => "hide",
        ArchivePolicyDto::RemoveWorktree => "remove_worktree",
    }
}
