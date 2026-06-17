// @purpose Groups backend workflows for application-wide settings.
// @role    Use-case barrel consumed by presentation settings commands.
// @deps    get_app_settings, update_app_settings
// @gotcha  Global settings are persisted in SQLite and may affect native actions.
pub(crate) mod get_app_settings;
pub(crate) mod update_app_settings;
