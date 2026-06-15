// @purpose Exposes SQLite repositories for Grove backend state.
// @role    Repository barrel consumed by use cases.
// @deps    projects_repository
// @gotcha  Repositories perform persistence only; workflows belong in use cases.
pub(crate) mod operations_repository;
pub(crate) mod projects_repository;
pub(crate) mod workspaces_repository;
