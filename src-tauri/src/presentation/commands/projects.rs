// @purpose Defines project-related Tauri business commands.
// @role    Thin presentation adapter from Tauri invoke to project use cases.
// @deps    tauri AppHandle/Manager, app state, project DTOs, shared command errors
// @gotcha  Keep workflow logic in use_cases/projects; docs/modules/tauri-runtime/README.md
use tauri::Manager;

use crate::app_state::AppState;
use crate::shared::dto::conductor::{ConductorImportCandidateDto, ImportConductorProjectsInput};
use crate::shared::dto::errors::{AppErrorDto, CommandResult};
use crate::shared::dto::projects::{ProjectDto, UpdateProjectSettingsInput, WorktreeProjectDto};
use crate::use_cases::projects::{
    import_conductor_projects, list_projects, list_worktree_projects, update_project_settings,
};

#[tauri::command]
#[specta::specta]
pub(crate) async fn list_projects(app: tauri::AppHandle) -> CommandResult<Vec<ProjectDto>> {
    let state = app.state::<AppState>();
    list_projects::run(&state.db)
        .await
        .map_err(AppErrorDto::from)
}

#[tauri::command]
#[specta::specta]
pub(crate) async fn import_conductor_projects(
    app: tauri::AppHandle,
    input: ImportConductorProjectsInput,
) -> CommandResult<Vec<ConductorImportCandidateDto>> {
    let state = app.state::<AppState>();
    import_conductor_projects::run(&state.db, input)
        .await
        .map_err(AppErrorDto::from)
}

#[tauri::command]
#[specta::specta]
pub(crate) async fn list_worktree_projects(
    app: tauri::AppHandle,
) -> CommandResult<Vec<WorktreeProjectDto>> {
    let state = app.state::<AppState>();
    list_worktree_projects::run(&state.db)
        .await
        .map_err(AppErrorDto::from)
}

#[tauri::command]
#[specta::specta]
pub(crate) async fn update_project_settings(
    app: tauri::AppHandle,
    input: UpdateProjectSettingsInput,
) -> CommandResult<ProjectDto> {
    let state = app.state::<AppState>();
    update_project_settings::run(&state.db, input)
        .await
        .map_err(AppErrorDto::from)
}
