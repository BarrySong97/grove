// @purpose Exposes SQLite connection and repository adapters.
// @role    Database infrastructure boundary used by backend use cases.
// @deps    connection, repositories
// @gotcha  SQLite stores Grove state only, not authoritative git status.
pub(crate) mod connection;
pub(crate) mod repositories;
