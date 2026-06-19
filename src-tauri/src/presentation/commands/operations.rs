// @purpose Defines operation inspection commands for logs and failed workflow UI.
// @role    Thin presentation adapter from Tauri invoke to operation repository/log reads.
// @deps    tauri app state, operation DTOs, operation repository, shared errors
// @gotcha  Frontend reads logs through these commands rather than direct filesystem paths.
use std::fs;

use tauri::Manager;

use crate::app_state::AppState;
use crate::infrastructure::db::repositories::operations_repository;
use crate::shared::dto::errors::{AppError, AppErrorDto, CommandResult};
use crate::shared::dto::operations::{
    OperationDto, OperationLogDto, OperationTargetInput, ReadOperationLogInput,
};

#[tauri::command]
#[specta::specta]
pub(crate) async fn get_latest_operation(
    app: tauri::AppHandle,
    input: OperationTargetInput,
) -> CommandResult<Option<OperationDto>> {
    let state = app.state::<AppState>();
    let result = if let Some(workspace_id) = input.workspace_id {
        operations_repository::latest_for_workspace(&state.db, &workspace_id).await
    } else if let Some(project_id) = input.project_id {
        operations_repository::latest_for_project(&state.db, &project_id).await
    } else {
        Ok(None)
    };
    result.map_err(AppErrorDto::from)
}

#[tauri::command]
#[specta::specta]
pub(crate) async fn read_operation_log(
    app: tauri::AppHandle,
    input: ReadOperationLogInput,
) -> CommandResult<OperationLogDto> {
    let state = app.state::<AppState>();
    let operation = operations_repository::get_operation(&state.db, &input.operation_id)
        .await
        .map_err(AppErrorDto::from)?;
    let Some(log_path) = operation.log_path else {
        return Err(AppErrorDto::from(AppError::Internal {
            message: "This operation does not have a log file.".into(),
        }));
    };
    let content = fs::read_to_string(&log_path)
        .map_err(|source| AppErrorDto::from(AppError::Filesystem(source)))?;
    Ok(OperationLogDto {
        operation_id: operation.id,
        content,
    })
}
