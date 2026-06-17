// @purpose Defines workspace DTOs returned by Grove business commands.
// @role    Type-safe command boundary for git worktree workspaces.
// @deps    serde, specta
// @gotcha  Grove does not model a user-current workspace; docs/spark/2026-06-15-grove-conductor-worktree-backend-design.md
use serde::{Deserialize, Serialize};
use specta::Type;

#[allow(dead_code)]
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub(crate) struct WorkspaceDto {
    pub id: String,
    pub project_id: String,
    pub name: String,
    pub branch: String,
    pub base_branch: Option<String>,
    pub path: String,
    pub lifecycle_status: WorkspaceLifecycleStatusDto,
    pub operation_status: WorkspaceOperationStatusDto,
    pub hidden_at: Option<String>,
    pub stale_at: Option<String>,
    pub git_state: Option<WorkspaceGitStateDto>,
}

#[allow(dead_code)]
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "snake_case")]
pub(crate) enum WorkspaceLifecycleStatusDto {
    Active,
    Hidden,
    Stale,
}

#[allow(dead_code)]
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "snake_case")]
pub(crate) enum WorkspaceOperationStatusDto {
    Idle,
    Creating,
    SettingUp,
    Archiving,
    Failed,
}

#[allow(dead_code)]
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub(crate) struct WorkspaceGitStateDto {
    pub ahead: i32,
    pub behind: i32,
    pub dirty: i32,
    pub last_commit_message: String,
    pub captured_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub(crate) struct RefreshProjectInput {
    pub project_id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub(crate) struct CreateWorkspaceInput {
    pub project_id: String,
    pub name: String,
    pub branch: String,
    pub base_branch: String,
    pub run_setup: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub(crate) struct ArchiveWorkspaceInput {
    pub workspace_id: String,
    pub policy: ArchivePolicyChoiceDto,
    pub remember_policy: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "snake_case")]
pub(crate) enum ArchivePolicyChoiceDto {
    Hide,
    RemoveWorktree,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub(crate) struct OpenWorkspaceInput {
    pub workspace_id: String,
    pub target: OpenWorkspaceTargetDto,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Type)]
#[serde(rename_all = "snake_case")]
pub(crate) enum OpenWorkspaceTargetDto {
    Finder,
    Zed,
    Cursor,
    VsCode,
    Ghostty,
    Terminal,
}
