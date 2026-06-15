// @purpose Groups backend application use cases.
// @role    Use-case module root between presentation commands and infrastructure adapters.
// @deps    projects
// @gotcha  Use cases own workflows; Tauri command handlers should stay thin.
pub(crate) mod projects;
pub(crate) mod workspaces;
