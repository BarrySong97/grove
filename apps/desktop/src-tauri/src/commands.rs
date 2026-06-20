// @purpose Defines Tauri commands callable from the frontend.
// @role    Command boundary for hiding the panel and quitting the app.
// @deps    tauri AppHandle/Manager
// @gotcha  Register new commands in lib.rs and capabilities before frontend use; docs/modules/tauri-runtime/README.md
use tauri::Manager;

#[tauri::command]
#[specta::specta]
pub(crate) fn hide_panel(app: tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.hide();
    }
}

#[tauri::command]
#[specta::specta]
pub(crate) fn quit_app(app: tauri::AppHandle) {
    app.exit(0);
}
