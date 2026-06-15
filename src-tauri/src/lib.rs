// @purpose Builds and runs the Tauri application.
// @role    Runtime composition layer for typed invoke handlers, database setup, tray, and window events.
// @deps    tauri Builder/Manager/WindowEvent, tauri-specta, sqlx state, local runtime modules
// @gotcha  Close/focus loss hides the panel instead of quitting; docs/modules/tauri-runtime/README.md
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
use tauri::{Manager, WindowEvent};

fn command_builder() -> tauri_specta::Builder<tauri::Wry> {
    tauri_specta::Builder::<tauri::Wry>::new().commands(tauri_specta::collect_commands![
        commands::hide_panel,
        commands::quit_app,
        presentation::commands::projects::import_conductor_projects,
        presentation::commands::projects::list_projects,
        presentation::commands::projects::list_worktree_projects,
        presentation::commands::projects::update_project_settings,
        presentation::commands::workspaces::archive_workspace,
        presentation::commands::workspaces::create_workspace,
        presentation::commands::workspaces::open_workspace,
        presentation::commands::workspaces::refresh_project
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

    tauri::Builder::default()
        .invoke_handler(specta_builder.invoke_handler())
        .setup(|app| {
            #[cfg(target_os = "macos")]
            app.set_activation_policy(tauri::ActivationPolicy::Accessory);

            let db = tauri::async_runtime::block_on(infrastructure::db::connection::connect(
                &app.handle(),
            ))
            .map_err(|error| std::io::Error::other(error.to_string()))?;
            app.manage(AppState { db });

            if let Some(window) = app.get_webview_window("main") {
                window::configure_transparent_panel(&window);
            }

            tray::setup(app)?;
            Ok(())
        })
        .on_window_event(|window, event| match event {
            WindowEvent::CloseRequested { api, .. } => {
                let _ = window.hide();
                api.prevent_close();
            }
            WindowEvent::Focused(false) => {
                let _ = window.hide();
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
