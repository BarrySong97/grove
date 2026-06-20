// @purpose Groups side-effect-free Grove backend domain rules.
// @role    Domain module root for conductor and workspace rules.
// @deps    conductor
// @gotcha  Domain code must not run git, read files, or touch SQLite.
pub(crate) mod conductor;
