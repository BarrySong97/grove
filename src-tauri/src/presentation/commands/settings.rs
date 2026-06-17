// @purpose Defines application settings Tauri business commands.
// @role    Thin presentation adapter from Tauri invoke to settings use cases.
// @deps    tauri AppHandle/Manager, app state, settings DTOs, shared command errors
// @gotcha  Keep persistence workflow in use_cases/settings.
use tauri::Manager;

use crate::app_state::AppState;
use crate::shared::dto::errors::{AppErrorDto, CommandResult};
use crate::shared::dto::settings::{AppSettingsDto, UpdateAppSettingsInput};
use crate::use_cases::settings::{get_app_settings, update_app_settings};

#[tauri::command]
#[specta::specta]
pub(crate) async fn get_app_settings(app: tauri::AppHandle) -> CommandResult<AppSettingsDto> {
    let state = app.state::<AppState>();
    get_app_settings::run(&state.db)
        .await
        .map_err(AppErrorDto::from)
}

#[tauri::command]
#[specta::specta]
pub(crate) async fn update_app_settings(
    app: tauri::AppHandle,
    input: UpdateAppSettingsInput,
) -> CommandResult<AppSettingsDto> {
    let state = app.state::<AppState>();
    update_app_settings::run(&state.db, input)
        .await
        .map_err(AppErrorDto::from)
}
