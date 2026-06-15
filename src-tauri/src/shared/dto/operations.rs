// @purpose Defines operation DTOs for long-running Grove backend actions.
// @role    Type-safe command boundary for create/setup/archive/open operation status.
// @deps    serde, specta
// @gotcha  Long command logs live on disk; DTOs expose only log paths and summaries.
use serde::{Deserialize, Serialize};
use specta::Type;

#[allow(dead_code)]
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub(crate) struct OperationDto {
    pub id: String,
    pub project_id: String,
    pub workspace_id: Option<String>,
    pub kind: OperationKindDto,
    pub status: OperationStatusDto,
    pub started_at: String,
    pub finished_at: Option<String>,
    pub exit_code: Option<i32>,
    pub log_path: Option<String>,
    pub error_message: Option<String>,
}

#[allow(dead_code)]
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "snake_case")]
pub(crate) enum OperationKindDto {
    Import,
    Refresh,
    Create,
    Setup,
    Archive,
    OpenEditor,
    OpenTerminal,
    RevealFinder,
}

#[allow(dead_code)]
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "snake_case")]
pub(crate) enum OperationStatusDto {
    Queued,
    Running,
    Succeeded,
    Failed,
}
