// @purpose Exposes project-related backend use cases.
// @role    Project use-case barrel consumed by presentation commands.
// @deps    create/list/import/update/remove project use cases
// @gotcha  Project settings update Grove overrides; remove project never deletes the main repo root.
pub(crate) mod create_project;
pub(crate) mod import_conductor_projects;
pub(crate) mod list_projects;
pub(crate) mod list_worktree_projects;
pub(crate) mod remove_project;
pub(crate) mod update_project_settings;
