// @purpose Holds shared backend state managed by the Tauri runtime.
// @role    Runtime state container for database pools and UI lifecycle guards.
// @deps    std sync atomics, sqlx SqlitePool
// @gotcha  Keep state cheap to clone through handles; do not store UI/window objects here.
use std::sync::{
    atomic::{AtomicBool, Ordering},
    Arc,
};

use sqlx::SqlitePool;

pub(crate) struct AppState {
    pub db: SqlitePool,
    native_dialog_open: Arc<AtomicBool>,
}

impl AppState {
    pub(crate) fn new(db: SqlitePool, native_dialog_open: Arc<AtomicBool>) -> Self {
        Self {
            db,
            native_dialog_open,
        }
    }

    pub(crate) fn native_dialog_guard(&self) -> NativeDialogGuard {
        self.native_dialog_open.store(true, Ordering::SeqCst);
        NativeDialogGuard {
            native_dialog_open: Arc::clone(&self.native_dialog_open),
        }
    }
}

pub(crate) struct NativeDialogGuard {
    native_dialog_open: Arc<AtomicBool>,
}

impl Drop for NativeDialogGuard {
    fn drop(&mut self) {
        self.native_dialog_open.store(false, Ordering::SeqCst);
    }
}
