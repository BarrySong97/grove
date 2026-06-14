// @purpose Generates the Grove template tray icon at runtime.
// @role    Icon rasterization helper consumed by tray setup.
// @deps    tauri image Image
// @gotcha  Keep alpha-only template behavior for macOS menu bar rendering; docs/modules/tauri-runtime/README.md
use tauri::image::Image;

pub(crate) fn tray_icon() -> Image<'static> {
    grove_icon()
}

fn grove_icon() -> Image<'static> {
    const SIZE: u32 = 32;
    const SCALE: f32 = SIZE as f32 / 16.0;
    let stroke_half = 0.95;
    let circle_radius = 1.7;
    let mut rgba = Vec::with_capacity((SIZE * SIZE * 4) as usize);

    for y in 0..SIZE {
        for x in 0..SIZE {
            let px = (x as f32 + 0.5) / SCALE;
            let py = (y as f32 + 0.5) / SCALE;
            let mut alpha = 0;

            for (cx, cy) in [(4.0, 3.3), (4.0, 12.7), (12.0, 3.3)] {
                let d = ((px - cx).powi(2) + (py - cy).powi(2)).sqrt();
                alpha = alpha.max(stroke_alpha((d - circle_radius).abs(), stroke_half));
            }

            for (ax, ay, bx, by) in [
                (4.0, 5.0, 4.0, 11.0),
                (4.0, 8.0, 8.3, 8.0),
                (8.3, 8.0, 12.0, 4.3),
                (12.0, 4.3, 12.0, 5.0),
            ] {
                alpha = alpha.max(stroke_alpha(
                    segment_distance(px, py, ax, ay, bx, by),
                    stroke_half,
                ));
            }

            rgba.extend_from_slice(&[0, 0, 0, alpha]);
        }
    }

    Image::new_owned(rgba, SIZE, SIZE)
}

fn stroke_alpha(distance: f32, half_width: f32) -> u8 {
    let fade = 0.35;

    if distance <= half_width {
        255
    } else if distance <= half_width + fade {
        ((1.0 - (distance - half_width) / fade) * 255.0).round() as u8
    } else {
        0
    }
}

fn segment_distance(px: f32, py: f32, ax: f32, ay: f32, bx: f32, by: f32) -> f32 {
    let abx = bx - ax;
    let aby = by - ay;
    let apx = px - ax;
    let apy = py - ay;
    let len_sq = abx * abx + aby * aby;
    let t = ((apx * abx + apy * aby) / len_sq).clamp(0.0, 1.0);
    let cx = ax + abx * t;
    let cy = ay + aby * t;

    ((px - cx).powi(2) + (py - cy).powi(2)).sqrt()
}
