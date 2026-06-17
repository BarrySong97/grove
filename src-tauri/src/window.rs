// @purpose Configures transparent webview/window surfaces and the Add project folder picker.
// @role    Platform adapter called during setup, before showing the panel, and before native dialogs.
// @deps    tauri WebviewWindow/AppHandle, tauri-plugin-dialog, macOS objc2 appkit/foundation/webkit APIs
// @gotcha  macOS transparency uses unsafe Objective-C bridge and must be manually verified; docs/modules/tauri-runtime/README.md
use std::path::PathBuf;

use tauri::WebviewWindow;
use tauri_plugin_dialog::DialogExt;

#[cfg(target_os = "macos")]
pub(crate) fn configure_transparent_panel(window: &WebviewWindow) {
    let _ = window.set_background_color(Some(tauri::window::Color(0, 0, 0, 0)));

    let _ = window.with_webview(|webview| unsafe {
        use objc2_app_kit::{NSColor, NSWindow};
        use objc2_foundation::{NSNumber, NSObjectNSKeyValueCoding, NSString};
        use objc2_web_kit::WKWebView;

        let view: &WKWebView = &*webview.inner().cast();
        let ns_window: &NSWindow = &*webview.ns_window().cast();
        let clear = NSColor::clearColor();
        let no = NSNumber::numberWithBool(false);
        let draws_background = NSString::from_str("drawsBackground");

        ns_window.setOpaque(false);
        ns_window.setBackgroundColor(Some(&clear));

        view.setValue_forKey(Some(&no), &draws_background);
        view.setUnderPageBackgroundColor(Some(&clear));

        let _: () = objc2::msg_send![view, setOpaque: false];
    });
}

pub(crate) fn pick_project_folder(app: &tauri::AppHandle) -> Option<PathBuf> {
    app.dialog()
        .file()
        .set_title("Choose project folder")
        .set_can_create_directories(false)
        .blocking_pick_folder()
        .and_then(|path| match path.into_path() {
            Ok(path) => Some(path),
            Err(error) => {
                eprintln!("[grove] selected project folder path was invalid: {error}");
                None
            }
        })
}

#[cfg(not(target_os = "macos"))]
pub(crate) fn configure_transparent_panel(_: &WebviewWindow) {}
