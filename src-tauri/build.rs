// @purpose Runs Tauri build-time code generation for the Rust crate.
// @role    Cargo build script invoked before compiling the Tauri runtime.
// @deps    tauri_build
// @gotcha  Keep build customization documented in docs/modules/tauri-runtime/README.md
fn main() {
    tauri_build::build()
}
