// @purpose Defines application-wide settings DTOs returned by Grove commands.
// @role    Type-safe command boundary for global panel preferences.
// @deps    serde, specta, workspace target DTOs
// @gotcha  Settings affect backend-owned native behavior, not frontend-only UI state.
use serde::{Deserialize, Serialize};
use specta::Type;

use crate::shared::dto::workspaces::OpenWorkspaceTargetDto;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Type)]
#[serde(rename_all = "snake_case")]
pub(crate) enum GhosttyOpenModeDto {
    Window,
    Tab,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub(crate) struct AppSettingsDto {
    pub ghostty_open_mode: GhosttyOpenModeDto,
    pub default_open_target: OpenWorkspaceTargetDto,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub(crate) struct UpdateAppSettingsInput {
    pub ghostty_open_mode: GhosttyOpenModeDto,
    pub default_open_target: OpenWorkspaceTargetDto,
}
