// @purpose Defines project-related Tauri business commands.
// @role    Thin presentation adapter from Tauri invoke to project use cases.
// @deps    tauri AppHandle/Manager, native window picker, app state, project DTOs, shared command errors
// @gotcha  Keep workflow logic in use_cases/projects; docs/modules/tauri-runtime/README.md
use std::path::PathBuf;

use tauri::Manager;

use crate::app_state::AppState;
use crate::shared::dto::conductor::{ConductorImportCandidateDto, ImportConductorProjectsInput};
use crate::shared::dto::errors::{AppError, AppErrorDto, CommandResult};
use crate::shared::dto::projects::{
    CreateProjectInput, ProjectDto, RemoveProjectInput, UpdateProjectSettingsInput,
    WorktreeProjectDto,
};
use crate::use_cases::projects::{
    create_project, import_conductor_projects, list_projects, list_worktree_projects,
    remove_project, update_project_settings,
};
use crate::window;

#[tauri::command]
#[specta::specta]
pub(crate) async fn create_project(
    app: tauri::AppHandle,
    input: CreateProjectInput,
) -> CommandResult<ProjectDto> {
    let state = app.state::<AppState>();
    create_project::run(&state.db, input)
        .await
        .map_err(AppErrorDto::from)
}

#[tauri::command]
#[specta::specta]
pub(crate) async fn add_project_from_folder_picker(
    app: tauri::AppHandle,
) -> CommandResult<Option<ProjectDto>> {
    let selected_root_path = {
        let state = app.state::<AppState>();
        let _dialog_guard = state.native_dialog_guard();
        let selected = window::pick_project_folder(&app);

        if let Some(panel) = app.get_webview_window("main") {
            let _ = panel.set_focus();
        }

        selected
    };

    let Some(root_path) = selected_root_path else {
        eprintln!("[grove] add project folder picker cancelled");
        return Ok(None);
    };
    eprintln!(
        "[grove] add project folder picker selected {}",
        root_path.display()
    );

    let state = app.state::<AppState>();
    match create_project::run(
        &state.db,
        CreateProjectInput {
            root_path: root_path.to_string_lossy().to_string(),
        },
    )
    .await
    {
        Ok(project) => {
            eprintln!("[grove] add project registered {}", project.root_path);
            Ok(Some(project))
        }
        Err(error) => {
            eprintln!("[grove] add project failed: {error}");
            Err(AppErrorDto::from(error))
        }
    }
}

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

#[tauri::command]
#[specta::specta]
pub(crate) async fn remove_project(
    app: tauri::AppHandle,
    input: RemoveProjectInput,
) -> CommandResult<()> {
    let state = app.state::<AppState>();
    let log_root = log_root(&app).map_err(AppErrorDto::from)?;
    remove_project::run(&state.db, input, log_root)
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
