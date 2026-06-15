// @purpose Defines project DTOs returned by Grove business commands.
// @role    Type-safe command boundary for registered repositories.
// @deps    serde, specta
// @gotcha  DTO fields mirror API contracts, not raw SQLite rows.
use serde::{Deserialize, Serialize};
use specta::Type;

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub(crate) struct ProjectDto {
    pub id: String,
    pub name: String,
    pub root_path: String,
    pub workspace_root: String,
    pub default_branch: String,
    pub config_source: ConfigSourceDto,
    pub archive_policy: ArchivePolicyDto,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub(crate) struct ProjectCommandsDto {
    pub run: String,
    pub setup: String,
    pub archive: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub(crate) struct WorktreeProjectDto {
    pub project: ProjectDto,
    pub commands: ProjectCommandsDto,
    pub workspaces: Vec<crate::shared::dto::workspaces::WorkspaceDto>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub(crate) struct UpdateProjectSettingsInput {
    pub project_id: String,
    pub workspace_root: String,
    pub archive_policy: ArchivePolicyDto,
    pub commands: ProjectCommandsDto,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "snake_case")]
pub(crate) enum ConfigSourceDto {
    ConductorSettings,
    ConductorJson,
    GroveOverride,
    None,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "snake_case")]
pub(crate) enum ArchivePolicyDto {
    Ask,
    Hide,
    RemoveWorktree,
}
