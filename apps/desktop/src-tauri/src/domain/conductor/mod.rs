// @purpose Exposes Conductor-compatible path and config rules.
// @role    Domain barrel used by Conductor infrastructure and import use cases.
// @deps    workspace_paths
// @gotcha  Keep rule functions pure; filesystem probing belongs in infrastructure.
pub(crate) mod workspace_paths;
