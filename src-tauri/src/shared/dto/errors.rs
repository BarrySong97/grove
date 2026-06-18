// @purpose Defines typed errors returned by business Tauri commands.
// @role    Cross-layer error DTO exported to TypeScript through specta.
// @deps    serde, specta, sqlx, thiserror
// @gotcha  Error messages must be UI-safe summaries, not raw sensitive command logs.
use serde::Serialize;
use specta::Type;
use thiserror::Error;

#[derive(Debug, Error)]
pub(crate) enum AppError {
    #[error("database error: {0}")]
    Database(#[from] sqlx::Error),
    #[error("database migration error: {0}")]
    Migration(#[from] sqlx::migrate::MigrateError),
    #[error("filesystem error: {0}")]
    Filesystem(#[from] std::io::Error),
    #[error("invalid repository: {message}")]
    InvalidRepo { message: String },
    #[error("git command failed: {message}")]
    GitCommandFailed { message: String },
    #[error("config parse failed: {message}")]
    ConfigParseFailed { message: String },
    #[error("workspace already exists: {message}")]
    WorkspaceExists { message: String },
    #[error("workspace has local changes: {message}")]
    WorkspaceDirty { message: String },
    #[error("operation already running: {message}")]
    OperationConflict { message: String },
    #[error("command failed: {message}")]
    CommandFailed { message: String },
    #[error("native open failed: {message}")]
    NativeOpenFailed { message: String },
    #[error("{message}")]
    Internal { message: String },
}

#[derive(Debug, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub(crate) struct AppErrorDto {
    pub code: String,
    pub message: String,
    pub details: Option<String>,
    pub recoverable: bool,
}

impl From<AppError> for AppErrorDto {
    fn from(error: AppError) -> Self {
        match error {
            AppError::Database(source) => Self {
                code: "database_error".into(),
                message: "Database operation failed.".into(),
                details: Some(source.to_string()),
                recoverable: true,
            },
            AppError::Migration(source) => Self {
                code: "database_error".into(),
                message: "Database migration failed.".into(),
                details: Some(source.to_string()),
                recoverable: true,
            },
            AppError::Filesystem(source) => Self {
                code: "permission_denied".into(),
                message: "Filesystem operation failed.".into(),
                details: Some(source.to_string()),
                recoverable: true,
            },
            AppError::InvalidRepo { message } => Self {
                code: "invalid_repo".into(),
                message,
                details: None,
                recoverable: true,
            },
            AppError::GitCommandFailed { message } => Self {
                code: "git_command_failed".into(),
                message,
                details: None,
                recoverable: true,
            },
            AppError::ConfigParseFailed { message } => Self {
                code: "config_not_found".into(),
                message,
                details: None,
                recoverable: true,
            },
            AppError::WorkspaceExists { message } => Self {
                code: "workspace_exists".into(),
                message,
                details: None,
                recoverable: true,
            },
            AppError::WorkspaceDirty { message } => Self {
                code: "workspace_dirty".into(),
                message,
                details: None,
                recoverable: true,
            },
            AppError::OperationConflict { message } => Self {
                code: "operation_conflict".into(),
                message,
                details: None,
                recoverable: true,
            },
            AppError::CommandFailed { message } => Self {
                code: "command_failed".into(),
                message,
                details: None,
                recoverable: true,
            },
            AppError::NativeOpenFailed { message } => Self {
                code: "native_open_failed".into(),
                message,
                details: None,
                recoverable: true,
            },
            AppError::Internal { message } => Self {
                code: "internal_error".into(),
                message,
                details: None,
                recoverable: false,
            },
        }
    }
}

pub(crate) type AppResult<T> = Result<T, AppError>;
pub(crate) type CommandResult<T> = Result<T, AppErrorDto>;
