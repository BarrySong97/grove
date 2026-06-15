// @purpose Exposes process execution adapters.
// @role    Infrastructure barrel for setup/archive command runner.
// @deps    command_runner
// @gotcha  User commands run through a shell with controlled cwd and environment.
pub(crate) mod command_runner;
