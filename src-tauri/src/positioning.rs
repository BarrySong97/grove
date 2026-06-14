use tauri::{LogicalPosition, LogicalSize, PhysicalPosition, Rect, WebviewWindow};

pub(crate) fn position_panel(
    window: &WebviewWindow,
    rect: Rect,
    click_position: Option<PhysicalPosition<f64>>,
) -> bool {
    let Some((monitor, tray_position, tray_size)) =
        resolve_tray_placement(window, rect, click_position)
    else {
        return false;
    };
    let Some((panel_width, panel_height)) = window_logical_size(window) else {
        return false;
    };

    let scale = monitor.scale_factor();
    let work_area = monitor.work_area();
    let work_position = work_area.position.to_logical::<f64>(scale);
    let work_size = work_area.size.to_logical::<f64>(scale);
    let inset = 4.0;
    let mut x = tray_position.x + tray_size.width - panel_width - 8.0;
    let mut y = tray_position.y + tray_size.height + 6.0;
    let min_x = work_position.x + inset;
    let min_y = work_position.y + inset;
    let max_x = work_position.x + work_size.width - panel_width - inset;
    let max_y = work_position.y + work_size.height - panel_height - inset;

    x = clamp_position(x, min_x, max_x);
    y = clamp_position(y, min_y, max_y);

    window.set_position(LogicalPosition::new(x, y)).is_ok()
}

fn clamp_position(value: f64, min: f64, max: f64) -> f64 {
    if min > max {
        min
    } else {
        value.clamp(min, max)
    }
}

fn monitor_logical_bounds(monitor: &tauri::window::Monitor) -> (f64, f64, f64, f64) {
    let scale = monitor.scale_factor();
    let position = monitor.position().to_logical::<f64>(scale);
    let size = monitor.size().to_logical::<f64>(scale);

    (
        position.x,
        position.y,
        position.x + size.width,
        position.y + size.height,
    )
}

fn contains_point(bounds: (f64, f64, f64, f64), x: f64, y: f64) -> bool {
    x >= bounds.0 && x <= bounds.2 && y >= bounds.1 && y <= bounds.3
}

fn contains_x(bounds: (f64, f64, f64, f64), x: f64) -> bool {
    x >= bounds.0 && x <= bounds.2
}

fn window_logical_size(window: &WebviewWindow) -> Option<(f64, f64)> {
    let size = window.outer_size().ok()?;
    let current_scale = window.scale_factor().unwrap_or(1.0);
    let logical_size = size.to_logical::<f64>(current_scale);

    Some((logical_size.width, logical_size.height))
}

fn resolve_tray_placement(
    window: &WebviewWindow,
    rect: Rect,
    click_position: Option<PhysicalPosition<f64>>,
) -> Option<(
    tauri::window::Monitor,
    LogicalPosition<f64>,
    LogicalSize<f64>,
)> {
    let monitors = window.available_monitors().ok()?;

    for monitor in &monitors {
        let scale = monitor.scale_factor();
        let tray_position = rect.position.to_logical::<f64>(scale);
        let tray_size = rect.size.to_logical::<f64>(scale);
        let click = click_position
            .map(|position| position.to_logical::<f64>(scale))
            .unwrap_or_else(|| {
                LogicalPosition::new(
                    tray_position.x + tray_size.width / 2.0,
                    tray_position.y + tray_size.height / 2.0,
                )
            });

        if contains_point(monitor_logical_bounds(monitor), click.x, click.y) {
            return Some((monitor.clone(), tray_position, tray_size));
        }
    }

    for monitor in monitors {
        let scale = monitor.scale_factor();
        let tray_position = rect.position.to_logical::<f64>(scale);
        let tray_size = rect.size.to_logical::<f64>(scale);
        let click_x = click_position
            .map(|position| position.to_logical::<f64>(scale).x)
            .unwrap_or(tray_position.x + tray_size.width / 2.0);

        if contains_x(monitor_logical_bounds(&monitor), click_x) {
            return Some((monitor, tray_position, tray_size));
        }
    }

    None
}
