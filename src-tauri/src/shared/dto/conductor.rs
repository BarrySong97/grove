// @purpose Defines Conductor import DTOs for discovery results and warnings.
// @role    Type-safe command boundary for Conductor-compatible project import.
// @deps    serde, specta, projects/workspaces DTOs
// @gotcha  Import candidates are read-only discovery results until explicitly imported.
use serde::{Deserialize, Serialize};
use specta::Type;

use super::projects::ConfigSourceDto;
use super::workspaces::WorkspaceDto;

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub(crate) struct ImportConductorProjectsInput {
    pub workspace_root: Option<String>,
}

#[allow(dead_code)]
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub(crate) struct ConductorImportCandidateDto {
    pub repo_name: String,
    pub root_path: String,
    pub workspace_root: String,
    pub config_source: ConfigSourceDto,
    pub workspaces: Vec<WorkspaceDto>,
    pub warnings: Vec<String>,
}
