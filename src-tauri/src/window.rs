// @purpose Configures transparent webview/window surfaces for the tray panel.
// @role    Platform adapter called during setup and before showing the panel.
// @deps    tauri WebviewWindow, macOS objc2 appkit/foundation/webkit APIs
// @gotcha  macOS branch uses unsafe Objective-C bridge and must be manually verified; docs/modules/tauri-runtime/README.md
use tauri::WebviewWindow;

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

#[cfg(not(target_os = "macos"))]
pub(crate) fn configure_transparent_panel(_: &WebviewWindow) {}
