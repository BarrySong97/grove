// @purpose Derives Conductor-compatible workspace path defaults.
// @role    Pure domain helper for import and create workspace flows.
// @deps    std env/path
// @gotcha  This fallback does not inspect Conductor user settings; that belongs in config infrastructure.
use std::path::PathBuf;

pub(crate) fn default_workspace_root() -> Option<PathBuf> {
    std::env::var_os("HOME")
        .map(PathBuf::from)
        .map(|home| home.join("conductor").join("workspaces"))
}
