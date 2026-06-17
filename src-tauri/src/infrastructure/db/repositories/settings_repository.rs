// @purpose Persists application-wide Grove settings in SQLite.
// @role    Settings repository consumed by app settings and workspace open use cases.
// @deps    sqlx SQLite pool, settings DTOs, shared errors
// @gotcha  Defaults must preserve existing app behavior for upgraded users.
use sqlx::SqlitePool;

use crate::shared::dto::errors::{AppError, AppResult};
use crate::shared::dto::settings::{AppSettingsDto, GhosttyOpenModeDto};
use crate::shared::dto::workspaces::OpenWorkspaceTargetDto;

const GHOSTTY_OPEN_MODE_KEY: &str = "ghostty_open_mode";
const DEFAULT_OPEN_TARGET_KEY: &str = "default_open_target";
const GHOSTTY_OPEN_MODE_WINDOW: &str = "window";
const GHOSTTY_OPEN_MODE_TAB: &str = "tab";
const OPEN_TARGET_FINDER: &str = "finder";
const OPEN_TARGET_ZED: &str = "zed";
const OPEN_TARGET_CURSOR: &str = "cursor";
const OPEN_TARGET_VS_CODE: &str = "vs_code";
const OPEN_TARGET_GHOSTTY: &str = "ghostty";
const OPEN_TARGET_TERMINAL: &str = "terminal";

pub(crate) async fn get_app_settings(pool: &SqlitePool) -> AppResult<AppSettingsDto> {
    let ghostty_open_mode =
        sqlx::query_scalar::<_, String>("SELECT value FROM app_settings WHERE key = ? LIMIT 1")
            .bind(GHOSTTY_OPEN_MODE_KEY)
            .fetch_optional(pool)
            .await?
            .map_or(Ok(GhosttyOpenModeDto::Window), |value| {
                parse_ghostty_open_mode(&value)
            })?;
    let default_open_target =
        sqlx::query_scalar::<_, String>("SELECT value FROM app_settings WHERE key = ? LIMIT 1")
            .bind(DEFAULT_OPEN_TARGET_KEY)
            .fetch_optional(pool)
            .await?
            .map_or(Ok(OpenWorkspaceTargetDto::Cursor), |value| {
                parse_open_target(&value)
            })?;

    Ok(AppSettingsDto {
        ghostty_open_mode,
        default_open_target,
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
    .bind(GHOSTTY_OPEN_MODE_KEY)
    .bind(format_ghostty_open_mode(&settings.ghostty_open_mode))
    .execute(pool)
    .await?;

    sqlx::query(
        "INSERT INTO app_settings (key, value, updated_at)
         VALUES (?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT(key) DO UPDATE SET
           value = excluded.value,
           updated_at = CURRENT_TIMESTAMP",
    )
    .bind(DEFAULT_OPEN_TARGET_KEY)
    .bind(format_open_target(&settings.default_open_target))
    .execute(pool)
    .await?;

    Ok(settings.clone())
}

fn parse_ghostty_open_mode(value: &str) -> AppResult<GhosttyOpenModeDto> {
    match value {
        GHOSTTY_OPEN_MODE_WINDOW => Ok(GhosttyOpenModeDto::Window),
        GHOSTTY_OPEN_MODE_TAB => Ok(GhosttyOpenModeDto::Tab),
        _ => Err(AppError::Internal {
            message: format!("Unknown Ghostty open mode: {value}"),
        }),
    }
}

fn format_ghostty_open_mode(value: &GhosttyOpenModeDto) -> &'static str {
    match value {
        GhosttyOpenModeDto::Window => GHOSTTY_OPEN_MODE_WINDOW,
        GhosttyOpenModeDto::Tab => GHOSTTY_OPEN_MODE_TAB,
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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_known_ghostty_open_modes() {
        assert_eq!(
            parse_ghostty_open_mode("window").expect("window should parse"),
            GhosttyOpenModeDto::Window
        );
        assert_eq!(
            parse_ghostty_open_mode("tab").expect("tab should parse"),
            GhosttyOpenModeDto::Tab
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
}
