// @purpose Opens and migrates the Grove SQLite database.
// @role    Database connection factory called during Tauri setup.
// @deps    sqlx SQLite, tauri path resolver, shared error DTO
// @gotcha  Dev/release data separation is handled by different Tauri identifiers, not by file name.
use std::fs;

use sqlx::sqlite::{SqliteConnectOptions, SqliteJournalMode, SqlitePoolOptions};
use sqlx::SqlitePool;
use tauri::Manager;

use crate::shared::dto::errors::{AppError, AppResult};

pub(crate) async fn connect(app: &tauri::AppHandle) -> AppResult<SqlitePool> {
    let data_dir = app
        .path()
        .app_data_dir()
        .map_err(|source| AppError::Internal {
            message: format!("Unable to resolve app data directory: {source}"),
        })?;
    fs::create_dir_all(&data_dir)?;

    let database_path = data_dir.join("grove.sqlite");
    let options = SqliteConnectOptions::new()
        .filename(database_path)
        .create_if_missing(true)
        .journal_mode(SqliteJournalMode::Wal)
        .foreign_keys(true);

    let pool = SqlitePoolOptions::new()
        .max_connections(5)
        .connect_with(options)
        .await?;

    sqlx::migrate!("./migrations").run(&pool).await?;
    Ok(pool)
}
