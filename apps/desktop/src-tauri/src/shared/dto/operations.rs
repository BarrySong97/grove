// @purpose Defines operation DTOs for Grove backend actions, logs, and retry surfaces.
// @role    Type-safe command boundary for workflow status and operation log access.
// @deps    serde, specta
// @gotcha  Long command logs live on disk; frontend reads them through backend commands.
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

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Type)]
#[serde(rename_all = "snake_case")]
pub(crate) enum OperationKindDto {
    Import,
    Refresh,
    Create,
    Setup,
    Archive,
    RemoveProject,
    OpenEditor,
    OpenTerminal,
    RevealFinder,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Type)]
#[serde(rename_all = "snake_case")]
pub(crate) enum OperationStatusDto {
    Queued,
    Running,
    Succeeded,
    Failed,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub(crate) struct OperationTargetInput {
    pub project_id: Option<String>,
    pub workspace_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub(crate) struct ReadOperationLogInput {
    pub operation_id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub(crate) struct OperationLogDto {
    pub operation_id: String,
    pub content: String,
}
