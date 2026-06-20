// @purpose Exposes native macOS opener adapters.
// @role    Infrastructure barrel for Finder, editor, and terminal opening.
// @deps    opener
// @gotcha  Paths must be passed safely and support spaces.
pub(crate) mod opener;
