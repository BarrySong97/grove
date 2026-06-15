// @purpose Exposes type-safe Tauri business command handlers.
// @role    Command barrel registered by the Tauri runtime and specta binding exporter.
// @deps    projects
// @gotcha  New commands must be registered in lib.rs, capabilities, bindings, and docs.
pub(crate) mod projects;
pub(crate) mod workspaces;
