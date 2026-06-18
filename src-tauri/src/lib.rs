// @purpose Builds and runs the Tauri application.
// @role    Runtime composition layer for typed invoke handlers, database setup, tray, and window events.
// @deps    tauri Builder/Manager/WindowEvent, tauri-specta, sqlx state, local runtime modules
// @gotcha  Focus loss hides the panel only outside native dialog flows; docs/modules/tauri-runtime/README.md
mod app_state;
mod commands;
mod domain;
mod infrastructure;
mod positioning;
mod presentation;
mod shared;
mod tray;
mod tray_icon;
mod use_cases;
mod window;

#[cfg(test)]
mod e2e_tests;

use app_state::AppState;
use specta_typescript::Typescript;
use std::sync::{
    atomic::{AtomicBool, Ordering},
    Arc,
};
use tauri::{Manager, WindowEvent};

fn command_builder() -> tauri_specta::Builder<tauri::Wry> {
    tauri_specta::Builder::<tauri::Wry>::new().commands(tauri_specta::collect_commands![
        presentation::commands::projects::add_project_from_folder_picker,
        commands::hide_panel,
        commands::quit_app,
        presentation::commands::operations::get_latest_operation,
        presentation::commands::operations::read_operation_log,
        presentation::commands::projects::create_project,
        presentation::commands::projects::import_conductor_projects,
        presentation::commands::projects::list_projects,
        presentation::commands::projects::list_worktree_projects,
        presentation::commands::projects::remove_project,
        presentation::commands::projects::update_project_settings,
        presentation::commands::settings::get_app_settings,
        presentation::commands::settings::update_app_settings,
        presentation::commands::workspaces::archive_workspace,
        presentation::commands::workspaces::create_workspace,
        presentation::commands::workspaces::open_workspace,
        presentation::commands::workspaces::refresh_project,
        presentation::commands::workspaces::retry_workspace_operation
    ])
}

fn export_typescript_bindings(builder: &tauri_specta::Builder<tauri::Wry>) {
    builder
        .export(
            Typescript::default().header(
                "/* eslint-disable */\n\
                /**\n\
                 * @purpose Generated type-safe Tauri command bindings.\n\
                 * @role    Frontend command client generated from Rust DTOs and handlers.\n\
                 * @deps    @tauri-apps/api/core\n\
                 * @gotcha  Do not edit by hand; regenerate from src-tauri specta export.\n\
                 */",
            ),
            "../src/shared/bindings/commands.ts",
        )
        .expect("failed to export TypeScript command bindings");
}

pub fn run() {
    let specta_builder = command_builder();
    #[cfg(debug_assertions)]
    export_typescript_bindings(&specta_builder);

    let panel_had_focus = Arc::new(AtomicBool::new(false));
    let native_dialog_open = Arc::new(AtomicBool::new(false));
    let panel_focus_state = Arc::clone(&panel_had_focus);
    let native_dialog_focus_state = Arc::clone(&native_dialog_open);
    let native_dialog_app_state = Arc::clone(&native_dialog_open);

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(specta_builder.invoke_handler())
        .setup(|app| {
            #[cfg(target_os = "macos")]
            app.set_activation_policy(tauri::ActivationPolicy::Accessory);

            let db = tauri::async_runtime::block_on(infrastructure::db::connection::connect(
                &app.handle(),
            ))
            .map_err(|error| std::io::Error::other(error.to_string()))?;
            app.manage(AppState::new(db, native_dialog_app_state));

            if let Some(window) = app.get_webview_window("main") {
                window::configure_transparent_panel(&window);
            }

            tray::setup(app)?;
            Ok(())
        })
        .on_window_event(move |window, event| match event {
            WindowEvent::CloseRequested { api, .. } => {
                let _ = window.hide();
                api.prevent_close();
            }
            WindowEvent::Focused(true) => {
                panel_focus_state.store(true, Ordering::SeqCst);
            }
            WindowEvent::Focused(false) => {
                if native_dialog_focus_state.load(Ordering::SeqCst) {
                    panel_focus_state.store(true, Ordering::SeqCst);
                    return;
                }

                if panel_focus_state.swap(false, Ordering::SeqCst) {
                    let _ = window.hide();
                }
            }
            _ => {}
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn export_bindings() {
        let builder = command_builder();
        export_typescript_bindings(&builder);
    }
}
