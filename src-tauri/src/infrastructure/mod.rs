// @purpose Groups side-effect adapters for Grove backend use cases.
// @role    Infrastructure module root for database, git, filesystem, process, and native adapters.
// @deps    db
// @gotcha  Domain and DTO modules must not depend on infrastructure.
pub(crate) mod conductor;
pub(crate) mod db;
pub(crate) mod filesystem;
pub(crate) mod git;
pub(crate) mod native;
pub(crate) mod process;
