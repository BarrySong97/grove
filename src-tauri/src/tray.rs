use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Manager,
};

use crate::{positioning, tray_icon, window};

pub(crate) fn setup(app: &mut tauri::App) -> tauri::Result<()> {
    let show_i = MenuItem::with_id(app, "show", "Show Panel", true, None::<&str>)?;
    let quit_i = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
    let menu = Menu::with_items(app, &[&show_i, &quit_i])?;

    TrayIconBuilder::new()
        .icon(tray_icon::tray_icon())
        .icon_as_template(true)
        .tooltip("Grove")
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_menu_event(|app, event| match event.id.as_ref() {
            "show" => show_panel(app, None, None),
            "quit" => app.exit(0),
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                rect,
                position,
                ..
            } = event
            {
                toggle_panel(tray.app_handle(), rect, position);
            }
        })
        .build(app)?;

    Ok(())
}

fn show_panel(
    app: &tauri::AppHandle,
    tray_rect: Option<tauri::Rect>,
    click_position: Option<tauri::PhysicalPosition<f64>>,
) {
    if let Some(window) = app.get_webview_window("main") {
        window::configure_transparent_panel(&window);

        if let Some(rect) = tray_rect {
            if !positioning::position_panel(&window, rect, click_position) {
                let _ = window.center();
            }
        } else {
            let _ = window.center();
        }

        let _ = window.unminimize();
        let _ = window.show();
        let _ = window.set_focus();
    }
}

fn toggle_panel(
    app: &tauri::AppHandle,
    tray_rect: tauri::Rect,
    click_position: tauri::PhysicalPosition<f64>,
) {
    if let Some(window) = app.get_webview_window("main") {
        if window.is_visible().unwrap_or(false) {
            let _ = window.hide();
        } else {
            show_panel(app, Some(tray_rect), Some(click_position));
        }
    }
}
