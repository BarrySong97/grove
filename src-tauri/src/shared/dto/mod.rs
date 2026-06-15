// @purpose Exposes type-safe backend DTO modules.
// @role    DTO barrel imported by commands, use cases, repositories, and binding export.
// @deps    errors, projects, workspaces, operations, conductor
// @gotcha  Keep DTOs detached from database rows and filesystem handles.
pub(crate) mod conductor;
pub(crate) mod errors;
pub(crate) mod operations;
pub(crate) mod projects;
pub(crate) mod workspaces;
