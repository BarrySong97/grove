// @purpose Defines application-wide settings DTOs returned by Grove commands.
// @role    Type-safe command boundary for global panel and destructive workflow preferences.
// @deps    serde, specta, project/workspace DTOs
// @gotcha  Settings affect backend-owned native and filesystem behavior, not frontend-only UI state.
use serde::{Deserialize, Serialize};
use specta::Type;

use crate::shared::dto::projects::ArchivePolicyDto;
use crate::shared::dto::workspaces::OpenWorkspaceTargetDto;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Type)]
#[serde(rename_all = "snake_case")]
pub(crate) enum AppLanguageDto {
    System,
    ZhCn,
    EnUs,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Type)]
#[serde(rename_all = "snake_case")]
pub(crate) enum RemoveProjectBehaviorDto {
    GroveOnly,
    DeleteWorktrees,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Type)]
#[serde(rename_all = "snake_case")]
pub(crate) enum NewProjectPositionDto {
    First,
    Last,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub(crate) struct AppSettingsDto {
    pub language: AppLanguageDto,
    pub hover_quick_open_targets: Vec<OpenWorkspaceTargetDto>,
    pub default_archive_policy: ArchivePolicyDto,
    pub remove_project_behavior: RemoveProjectBehaviorDto,
    pub new_project_position: NewProjectPositionDto,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub(crate) struct UpdateAppSettingsInput {
    pub language: AppLanguageDto,
    pub hover_quick_open_targets: Vec<OpenWorkspaceTargetDto>,
    pub default_archive_policy: ArchivePolicyDto,
    pub remove_project_behavior: RemoveProjectBehaviorDto,
    pub new_project_position: NewProjectPositionDto,
}
