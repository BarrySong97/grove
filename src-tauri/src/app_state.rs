// @purpose Holds shared backend state managed by the Tauri runtime.
// @role    Runtime state container for database pools and future backend services.
// @deps    sqlx SqlitePool
// @gotcha  Keep state cheap to clone through handles; do not store UI/window objects here.
use sqlx::SqlitePool;

pub(crate) struct AppState {
    pub db: SqlitePool,
}
