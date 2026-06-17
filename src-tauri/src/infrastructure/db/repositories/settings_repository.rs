// @purpose Persists application-wide Grove settings in SQLite.
// @role    Settings repository consumed by app settings and workspace open use cases.
// @deps    sqlx SQLite pool, settings DTOs, shared errors
// @gotcha  Defaults must preserve existing app behavior for upgraded users.
use sqlx::SqlitePool;

use crate::shared::dto::errors::{AppError, AppResult};
use crate::shared::dto::settings::{AppSettingsDto, GhosttyOpenModeDto};

const GHOSTTY_OPEN_MODE_KEY: &str = "ghostty_open_mode";
const GHOSTTY_OPEN_MODE_WINDOW: &str = "window";
const GHOSTTY_OPEN_MODE_TAB: &str = "tab";

pub(crate) async fn get_app_settings(pool: &SqlitePool) -> AppResult<AppSettingsDto> {
    let ghostty_open_mode =
        sqlx::query_scalar::<_, String>("SELECT value FROM app_settings WHERE key = ? LIMIT 1")
            .bind(GHOSTTY_OPEN_MODE_KEY)
            .fetch_optional(pool)
            .await?
            .map_or(Ok(GhosttyOpenModeDto::Window), |value| {
                parse_ghostty_open_mode(&value)
            })?;

    Ok(AppSettingsDto { ghostty_open_mode })
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
}
