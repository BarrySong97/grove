// @purpose Exposes project-related backend use cases.
// @role    Project use-case barrel consumed by presentation commands.
// @deps    create/list/import/update project use cases
// @gotcha  Project settings update Grove overrides; it does not write Conductor files.
pub(crate) mod create_project;
pub(crate) mod import_conductor_projects;
pub(crate) mod list_projects;
pub(crate) mod list_worktree_projects;
pub(crate) mod update_project_settings;
