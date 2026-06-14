// @purpose Builds and runs the Tauri application.
// @role    Runtime composition layer for invoke handlers, setup, tray, and window events.
// @deps    tauri Builder/Manager/WindowEvent plus local runtime modules
// @gotcha  Close/focus loss hides the panel instead of quitting; docs/modules/tauri-runtime/README.md
mod commands;
mod positioning;
mod tray;
mod tray_icon;
mod window;

use tauri::{Manager, WindowEvent};

pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            commands::hide_panel,
            commands::quit_app
        ])
        .setup(|app| {
            #[cfg(target_os = "macos")]
            app.set_activation_policy(tauri::ActivationPolicy::Accessory);

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
