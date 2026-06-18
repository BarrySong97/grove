// @purpose Persists application-wide Grove settings.
// @role    Settings use case for updates from the global settings view.
// @deps    settings repository, settings DTOs
// @gotcha  Updates apply to subsequent native open, archive, and remove project operations.
use sqlx::SqlitePool;

use crate::infrastructure::db::repositories::settings_repository;
use crate::shared::dto::errors::AppResult;
use crate::shared::dto::settings::{AppSettingsDto, UpdateAppSettingsInput};

pub(crate) async fn run(
    pool: &SqlitePool,
    input: UpdateAppSettingsInput,
) -> AppResult<AppSettingsDto> {
    let settings = AppSettingsDto {
        ghostty_open_mode: input.ghostty_open_mode,
        default_open_target: input.default_open_target,
        default_archive_policy: input.default_archive_policy,
        remove_project_behavior: input.remove_project_behavior,
    };
    settings_repository::update_app_settings(pool, &settings).await
}
