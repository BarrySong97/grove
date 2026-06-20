// @purpose Starts the Tauri application binary.
// @role    Thin binary entrypoint that delegates to the library run function.
// @deps    tauri_tray_lib::run
// @gotcha  Keep startup logic in lib.rs for testability and reuse; docs/modules/tauri-runtime/README.md
fn main() {
    tauri_tray_lib::run()
}
