// @purpose Loads application-wide Grove settings.
// @role    Settings use case for the global settings view.
// @deps    settings repository, settings DTOs
// @gotcha  Repository defaults preserve behavior when no settings row exists.
use sqlx::SqlitePool;

use crate::infrastructure::db::repositories::settings_repository;
use crate::shared::dto::errors::AppResult;
use crate::shared::dto::settings::AppSettingsDto;

pub(crate) async fn run(pool: &SqlitePool) -> AppResult<AppSettingsDto> {
    settings_repository::get_app_settings(pool).await
}
