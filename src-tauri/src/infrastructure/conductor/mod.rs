// @purpose Exposes Conductor-compatible configuration readers.
// @role    Infrastructure barrel for settings.toml and conductor.json parsing.
// @deps    config_repository
// @gotcha  Config files are source input; resolved Grove overrides are persisted separately.
pub(crate) mod config_repository;
