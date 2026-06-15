// @purpose Defines workspace-related Tauri business commands.
// @role    Thin presentation adapter from Tauri invoke to workspace use cases.
// @deps    tauri AppHandle/Manager, app state, workspace DTOs, shared command errors
// @gotcha  Keep git/process/native workflows in use_cases/workspaces.
use std::path::PathBuf;

use tauri::Manager;

use crate::app_state::AppState;
use crate::shared::dto::errors::{AppError, AppErrorDto, CommandResult};
use crate::shared::dto::workspaces::{
    ArchiveWorkspaceInput, CreateWorkspaceInput, OpenWorkspaceInput, RefreshProjectInput,
    WorkspaceDto,
};
use crate::use_cases::workspaces::{
    archive_workspace, create_workspace, open_workspace, refresh_project,
};

#[tauri::command]
#[specta::specta]
pub(crate) async fn refresh_project(
    app: tauri::AppHandle,
    input: RefreshProjectInput,
) -> CommandResult<Vec<WorkspaceDto>> {
    let state = app.state::<AppState>();
    refresh_project::run(&state.db, input)
        .await
        .map_err(AppErrorDto::from)
}

#[tauri::command]
#[specta::specta]
pub(crate) async fn create_workspace(
    app: tauri::AppHandle,
    input: CreateWorkspaceInput,
) -> CommandResult<WorkspaceDto> {
    let state = app.state::<AppState>();
    let log_root = log_root(&app).map_err(AppErrorDto::from)?;
    create_workspace::run(&state.db, input, log_root)
        .await
        .map_err(AppErrorDto::from)
}

#[tauri::command]
#[specta::specta]
pub(crate) async fn archive_workspace(
    app: tauri::AppHandle,
    input: ArchiveWorkspaceInput,
) -> CommandResult<WorkspaceDto> {
    let state = app.state::<AppState>();
    let log_root = log_root(&app).map_err(AppErrorDto::from)?;
    archive_workspace::run(&state.db, input, log_root)
        .await
        .map_err(AppErrorDto::from)
}

#[tauri::command]
#[specta::specta]
pub(crate) async fn open_workspace(
    app: tauri::AppHandle,
    input: OpenWorkspaceInput,
) -> CommandResult<WorkspaceDto> {
    let state = app.state::<AppState>();
    open_workspace::run(&state.db, input)
        .await
        .map_err(AppErrorDto::from)
}

fn log_root(app: &tauri::AppHandle) -> Result<PathBuf, AppError> {
    Ok(app
        .path()
        .app_log_dir()
        .map_err(|source| AppError::Internal {
            message: format!("Unable to resolve app log directory: {source}"),
        })?
        .join("operations"))
}
