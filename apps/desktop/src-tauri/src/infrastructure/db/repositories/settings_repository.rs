// @purpose Persists application-wide Grove settings in SQLite.
// @role    Settings repository consumed by app settings, archive, remove, and open use cases.
// @deps    sqlx SQLite pool, settings DTOs, shared errors
// @gotcha  Defaults must preserve existing app behavior and avoid destructive removal surprises.
use sqlx::SqlitePool;

use crate::shared::dto::errors::{AppError, AppResult};
use crate::shared::dto::projects::ArchivePolicyDto;
use crate::shared::dto::settings::{
    AppLanguageDto, AppSettingsDto, NewProjectPositionDto, RemoveProjectBehaviorDto,
};
use crate::shared::dto::workspaces::OpenWorkspaceTargetDto;

const LANGUAGE_KEY: &str = "language";
const HOVER_QUICK_OPEN_TARGETS_KEY: &str = "hover_quick_open_targets";
const DEFAULT_ARCHIVE_POLICY_KEY: &str = "default_archive_policy";
const REMOVE_PROJECT_BEHAVIOR_KEY: &str = "remove_project_behavior";
const NEW_PROJECT_POSITION_KEY: &str = "new_project_position";
const LANGUAGE_SYSTEM: &str = "system";
const LANGUAGE_ZH_CN: &str = "zh_cn";
const LANGUAGE_EN_US: &str = "en_us";
const ARCHIVE_POLICY_ASK: &str = "ask";
const ARCHIVE_POLICY_HIDE: &str = "hide";
const ARCHIVE_POLICY_REMOVE_WORKTREE: &str = "remove_worktree";
const REMOVE_PROJECT_GROVE_ONLY: &str = "grove_only";
const REMOVE_PROJECT_DELETE_WORKTREES: &str = "delete_worktrees";
const NEW_PROJECT_POSITION_FIRST: &str = "first";
const NEW_PROJECT_POSITION_LAST: &str = "last";
const OPEN_TARGET_FINDER: &str = "finder";
const OPEN_TARGET_ZED: &str = "zed";
const OPEN_TARGET_CURSOR: &str = "cursor";
const OPEN_TARGET_VS_CODE: &str = "vs_code";
const OPEN_TARGET_GHOSTTY: &str = "ghostty";
const OPEN_TARGET_TERMINAL: &str = "terminal";

pub(crate) async fn get_app_settings(pool: &SqlitePool) -> AppResult<AppSettingsDto> {
    let language =
        sqlx::query_scalar::<_, String>("SELECT value FROM app_settings WHERE key = ? LIMIT 1")
            .bind(LANGUAGE_KEY)
            .fetch_optional(pool)
            .await?
            .map_or(Ok(AppLanguageDto::System), |value| parse_language(&value))?;
    let hover_quick_open_targets =
        sqlx::query_scalar::<_, String>("SELECT value FROM app_settings WHERE key = ? LIMIT 1")
            .bind(HOVER_QUICK_OPEN_TARGETS_KEY)
            .fetch_optional(pool)
            .await?
            .map_or_else(|| Ok(default_hover_quick_open_targets()), |value| {
                parse_open_targets(&value)
            })?;
    let default_archive_policy =
        sqlx::query_scalar::<_, String>("SELECT value FROM app_settings WHERE key = ? LIMIT 1")
            .bind(DEFAULT_ARCHIVE_POLICY_KEY)
            .fetch_optional(pool)
            .await?
            .map_or(Ok(ArchivePolicyDto::Ask), |value| {
                parse_archive_policy(&value)
            })?;
    let remove_project_behavior =
        sqlx::query_scalar::<_, String>("SELECT value FROM app_settings WHERE key = ? LIMIT 1")
            .bind(REMOVE_PROJECT_BEHAVIOR_KEY)
            .fetch_optional(pool)
            .await?
            .map_or(Ok(RemoveProjectBehaviorDto::GroveOnly), |value| {
                parse_remove_project_behavior(&value)
            })?;
    let new_project_position =
        sqlx::query_scalar::<_, String>("SELECT value FROM app_settings WHERE key = ? LIMIT 1")
            .bind(NEW_PROJECT_POSITION_KEY)
            .fetch_optional(pool)
            .await?
            .map_or(Ok(NewProjectPositionDto::First), |value| {
                parse_new_project_position(&value)
            })?;

    Ok(AppSettingsDto {
        language,
        hover_quick_open_targets,
        default_archive_policy,
        remove_project_behavior,
        new_project_position,
    })
}

pub(crate) async fn update_app_settings(
    pool: &SqlitePool,
    settings: &AppSettingsDto,
) -> AppResult<AppSettingsDto> {
    sqlx::query(
        "INSERT INTO app_settings (key, value, updated_at)
         VALUES (?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT(key) DO UPDATE SET
           value = excluded.value,
           updated_at = CURRENT_TIMESTAMP",
    )
    .bind(LANGUAGE_KEY)
    .bind(format_language(&settings.language))
    .execute(pool)
    .await?;

    sqlx::query(
        "INSERT INTO app_settings (key, value, updated_at)
         VALUES (?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT(key) DO UPDATE SET
           value = excluded.value,
           updated_at = CURRENT_TIMESTAMP",
    )
    .bind(HOVER_QUICK_OPEN_TARGETS_KEY)
    .bind(format_open_targets(&settings.hover_quick_open_targets))
    .execute(pool)
    .await?;

    sqlx::query(
        "INSERT INTO app_settings (key, value, updated_at)
         VALUES (?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT(key) DO UPDATE SET
           value = excluded.value,
           updated_at = CURRENT_TIMESTAMP",
    )
    .bind(DEFAULT_ARCHIVE_POLICY_KEY)
    .bind(format_archive_policy(&settings.default_archive_policy))
    .execute(pool)
    .await?;

    sqlx::query(
        "INSERT INTO app_settings (key, value, updated_at)
         VALUES (?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT(key) DO UPDATE SET
           value = excluded.value,
           updated_at = CURRENT_TIMESTAMP",
    )
    .bind(REMOVE_PROJECT_BEHAVIOR_KEY)
    .bind(format_remove_project_behavior(
        &settings.remove_project_behavior,
    ))
    .execute(pool)
    .await?;

    sqlx::query(
        "INSERT INTO app_settings (key, value, updated_at)
         VALUES (?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT(key) DO UPDATE SET
           value = excluded.value,
           updated_at = CURRENT_TIMESTAMP",
    )
    .bind(NEW_PROJECT_POSITION_KEY)
    .bind(format_new_project_position(&settings.new_project_position))
    .execute(pool)
    .await?;

    Ok(settings.clone())
}

fn parse_language(value: &str) -> AppResult<AppLanguageDto> {
    match value {
        LANGUAGE_SYSTEM => Ok(AppLanguageDto::System),
        LANGUAGE_ZH_CN => Ok(AppLanguageDto::ZhCn),
        LANGUAGE_EN_US => Ok(AppLanguageDto::EnUs),
        _ => Err(AppError::Internal {
            message: format!("Unknown app language: {value}"),
        }),
    }
}

fn format_language(value: &AppLanguageDto) -> &'static str {
    match value {
        AppLanguageDto::System => LANGUAGE_SYSTEM,
        AppLanguageDto::ZhCn => LANGUAGE_ZH_CN,
        AppLanguageDto::EnUs => LANGUAGE_EN_US,
    }
}

fn parse_open_target(value: &str) -> AppResult<OpenWorkspaceTargetDto> {
    match value {
        OPEN_TARGET_FINDER => Ok(OpenWorkspaceTargetDto::Finder),
        OPEN_TARGET_ZED => Ok(OpenWorkspaceTargetDto::Zed),
        OPEN_TARGET_CURSOR => Ok(OpenWorkspaceTargetDto::Cursor),
        OPEN_TARGET_VS_CODE => Ok(OpenWorkspaceTargetDto::VsCode),
        OPEN_TARGET_GHOSTTY => Ok(OpenWorkspaceTargetDto::Ghostty),
        OPEN_TARGET_TERMINAL => Ok(OpenWorkspaceTargetDto::Terminal),
        _ => Err(AppError::Internal {
            message: format!("Unknown default open target: {value}"),
        }),
    }
}

fn format_open_target(value: &OpenWorkspaceTargetDto) -> &'static str {
    match value {
        OpenWorkspaceTargetDto::Finder => OPEN_TARGET_FINDER,
        OpenWorkspaceTargetDto::Zed => OPEN_TARGET_ZED,
        OpenWorkspaceTargetDto::Cursor => OPEN_TARGET_CURSOR,
        OpenWorkspaceTargetDto::VsCode => OPEN_TARGET_VS_CODE,
        OpenWorkspaceTargetDto::Ghostty => OPEN_TARGET_GHOSTTY,
        OpenWorkspaceTargetDto::Terminal => OPEN_TARGET_TERMINAL,
    }
}

fn default_hover_quick_open_targets() -> Vec<OpenWorkspaceTargetDto> {
    vec![OpenWorkspaceTargetDto::Cursor, OpenWorkspaceTargetDto::Terminal]
}

fn parse_open_targets(value: &str) -> AppResult<Vec<OpenWorkspaceTargetDto>> {
    value
        .split(',')
        .map(str::trim)
        .filter(|token| !token.is_empty())
        .map(parse_open_target)
        .collect()
}

fn format_open_targets(values: &[OpenWorkspaceTargetDto]) -> String {
    values
        .iter()
        .map(format_open_target)
        .collect::<Vec<_>>()
        .join(",")
}

fn parse_archive_policy(value: &str) -> AppResult<ArchivePolicyDto> {
    match value {
        ARCHIVE_POLICY_ASK => Ok(ArchivePolicyDto::Ask),
        ARCHIVE_POLICY_HIDE => Ok(ArchivePolicyDto::Hide),
        ARCHIVE_POLICY_REMOVE_WORKTREE => Ok(ArchivePolicyDto::RemoveWorktree),
        _ => Err(AppError::Internal {
            message: format!("Unknown default archive policy: {value}"),
        }),
    }
}

fn format_archive_policy(value: &ArchivePolicyDto) -> &'static str {
    match value {
        ArchivePolicyDto::UseGlobal | ArchivePolicyDto::Ask => ARCHIVE_POLICY_ASK,
        ArchivePolicyDto::Hide => ARCHIVE_POLICY_HIDE,
        ArchivePolicyDto::RemoveWorktree => ARCHIVE_POLICY_REMOVE_WORKTREE,
    }
}

fn parse_remove_project_behavior(value: &str) -> AppResult<RemoveProjectBehaviorDto> {
    match value {
        REMOVE_PROJECT_GROVE_ONLY => Ok(RemoveProjectBehaviorDto::GroveOnly),
        REMOVE_PROJECT_DELETE_WORKTREES => Ok(RemoveProjectBehaviorDto::DeleteWorktrees),
        _ => Err(AppError::Internal {
            message: format!("Unknown remove project behavior: {value}"),
        }),
    }
}

fn parse_new_project_position(value: &str) -> AppResult<NewProjectPositionDto> {
    match value {
        NEW_PROJECT_POSITION_FIRST => Ok(NewProjectPositionDto::First),
        NEW_PROJECT_POSITION_LAST => Ok(NewProjectPositionDto::Last),
        _ => Err(AppError::Internal {
            message: format!("Unknown new project position: {value}"),
        }),
    }
}

fn format_new_project_position(value: &NewProjectPositionDto) -> &'static str {
    match value {
        NewProjectPositionDto::First => NEW_PROJECT_POSITION_FIRST,
        NewProjectPositionDto::Last => NEW_PROJECT_POSITION_LAST,
    }
}

fn format_remove_project_behavior(value: &RemoveProjectBehaviorDto) -> &'static str {
    match value {
        RemoveProjectBehaviorDto::GroveOnly => REMOVE_PROJECT_GROVE_ONLY,
        RemoveProjectBehaviorDto::DeleteWorktrees => REMOVE_PROJECT_DELETE_WORKTREES,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_known_app_languages() {
        assert_eq!(
            parse_language("system").expect("system should parse"),
            AppLanguageDto::System
        );
        assert_eq!(
            parse_language("zh_cn").expect("zh cn should parse"),
            AppLanguageDto::ZhCn
        );
        assert_eq!(
            parse_language("en_us").expect("en us should parse"),
            AppLanguageDto::EnUs
        );
    }

    #[test]
    fn parses_known_open_targets() {
        assert_eq!(
            parse_open_target("cursor").expect("cursor should parse"),
            OpenWorkspaceTargetDto::Cursor
        );
        assert_eq!(
            parse_open_target("vs_code").expect("vs code should parse"),
            OpenWorkspaceTargetDto::VsCode
        );
    }

    #[test]
    fn round_trips_hover_quick_open_targets() {
        let targets = vec![
            OpenWorkspaceTargetDto::Cursor,
            OpenWorkspaceTargetDto::Terminal,
        ];
        let formatted = format_open_targets(&targets);
        assert_eq!(formatted, "cursor,terminal");
        assert_eq!(
            parse_open_targets(&formatted).expect("targets should parse"),
            targets
        );
        assert_eq!(
            parse_open_targets("").expect("empty should parse"),
            Vec::<OpenWorkspaceTargetDto>::new()
        );
    }

    #[test]
    fn parses_global_workflow_settings() {
        assert_eq!(
            parse_archive_policy("remove_worktree").expect("policy should parse"),
            ArchivePolicyDto::RemoveWorktree
        );
        assert_eq!(
            parse_remove_project_behavior("delete_worktrees").expect("behavior should parse"),
            RemoveProjectBehaviorDto::DeleteWorktrees
        );
        assert_eq!(
            parse_new_project_position("last").expect("position should parse"),
            NewProjectPositionDto::Last
        );
    }
}
