// @purpose Exposes filesystem adapters for Grove workspace workflows.
// @role    Infrastructure barrel for files-to-copy support.
// @deps    file_copy
// @gotcha  Copy behavior is Conductor-compatible and limited to gitignored matching files.
pub(crate) mod file_copy;
