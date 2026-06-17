// @purpose Opens workspace paths in supported Finder/editor/terminal targets.
// @role    Native adapter used by open workspace use cases.
// @deps    std process/path, OpenWorkspace target/settings DTOs, shared errors
// @gotcha  App CLI args pass paths separately; AppleScript strings must quote paths safely.
use std::ffi::OsString;
use std::path::Path;
use std::process::Command;

use crate::shared::dto::errors::{AppError, AppResult};
use crate::shared::dto::settings::GhosttyOpenModeDto;
use crate::shared::dto::workspaces::OpenWorkspaceTargetDto;

pub(crate) fn open(
    target: &OpenWorkspaceTargetDto,
    workspace_path: &Path,
    ghostty_open_mode: &GhosttyOpenModeDto,
) -> AppResult<()> {
    match target {
        OpenWorkspaceTargetDto::Finder => open_command(["-R"].as_slice(), Some(workspace_path)),
        OpenWorkspaceTargetDto::Zed => cli_or_app("zed", "Zed", workspace_path),
        OpenWorkspaceTargetDto::Cursor => open_editor("cursor", "Cursor", workspace_path),
        OpenWorkspaceTargetDto::VsCode => open_editor("code", "Visual Studio Code", workspace_path),
        OpenWorkspaceTargetDto::Ghostty => open_ghostty(workspace_path, ghostty_open_mode),
        OpenWorkspaceTargetDto::Terminal => open_terminal_app("Terminal", workspace_path),
    }
}

fn cli_or_app(cli: &str, app: &str, path: &Path) -> AppResult<()> {
    if Command::new(cli)
        .arg(path)
        .status()
        .is_ok_and(|status| status.success())
    {
        return Ok(());
    }

    open_app(app, path)
}

fn open_editor(cli: &str, app: &str, path: &Path) -> AppResult<()> {
    if Command::new(cli)
        .arg("--new-window")
        .arg(path)
        .status()
        .is_ok_and(|status| status.success())
    {
        return Ok(());
    }

    open_app_with_args(app, ["--new-window"].as_slice(), path)
}

fn open_app(app: &str, path: &Path) -> AppResult<()> {
    let status = Command::new("open").arg("-a").arg(app).arg(path).status()?;
    if status.success() {
        Ok(())
    } else {
        Err(AppError::NativeOpenFailed {
            message: format!("Failed to open {app}."),
        })
    }
}

fn open_app_with_args(app: &str, args: &[&str], path: &Path) -> AppResult<()> {
    let status = Command::new("open")
        .arg("-n")
        .arg("-a")
        .arg(app)
        .arg("--args")
        .args(args)
        .arg(path)
        .status()?;
    if status.success() {
        Ok(())
    } else {
        Err(AppError::NativeOpenFailed {
            message: format!("Failed to open {app}."),
        })
    }
}

fn open_command(args: &[&str], path: Option<&Path>) -> AppResult<()> {
    let mut command = Command::new("open");
    command.args(args);
    if let Some(path) = path {
        command.arg(path);
    }
    let status = command.status()?;
    if status.success() {
        Ok(())
    } else {
        Err(AppError::NativeOpenFailed {
            message: "Failed to open Finder.".into(),
        })
    }
}

fn open_ghostty(path: &Path, mode: &GhosttyOpenModeDto) -> AppResult<()> {
    let args = ghostty_args(path, mode);
    let status = Command::new("open").args(args).status()?;
    if status.success() {
        Ok(())
    } else {
        Err(AppError::NativeOpenFailed {
            message: "Failed to open Ghostty.".into(),
        })
    }
}

fn ghostty_args(path: &Path, mode: &GhosttyOpenModeDto) -> Vec<String> {
    match mode {
        GhosttyOpenModeDto::Window => vec![
            "-n".into(),
            "-a".into(),
            "Ghostty".into(),
            "--args".into(),
            ghostty_working_directory_arg(path),
        ],
        GhosttyOpenModeDto::Tab => vec![
            "-a".into(),
            "Ghostty".into(),
            path.to_string_lossy().into_owned(),
        ],
    }
}

fn ghostty_working_directory_arg(path: &Path) -> String {
    let mut arg = OsString::from("--working-directory=");
    arg.push(path.as_os_str());
    arg.to_string_lossy().into_owned()
}

fn open_terminal_app(app: &str, path: &Path) -> AppResult<()> {
    let script = terminal_script(app, path);
    let status = Command::new("osascript").arg("-e").arg(script).status()?;
    if status.success() {
        Ok(())
    } else {
        open_app(app, path)
    }
}

fn shell_cd(path: &Path) -> String {
    format!(
        "{:?}",
        format!("cd {}", shell_quote(&path.to_string_lossy()))
    )
}

fn shell_quote(value: &str) -> String {
    format!("'{}'", value.replace('\'', "'\\''"))
}

fn terminal_script(app: &str, path: &Path) -> String {
    format!(
        "tell application {app:?} to activate\n\
         tell application {app:?} to do script {}",
        shell_cd(path)
    )
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::PathBuf;

    #[test]
    fn ghostty_window_args_keep_space_path_as_single_argument() {
        let path = PathBuf::from("/tmp/grove path/workspace one");
        assert_eq!(
            ghostty_args(&path, &GhosttyOpenModeDto::Window),
            vec![
                "-n",
                "-a",
                "Ghostty",
                "--args",
                "--working-directory=/tmp/grove path/workspace one",
            ]
        );
    }

    #[test]
    fn ghostty_tab_args_open_folder_document() {
        let path = PathBuf::from("/tmp/grove path/workspace one");
        assert_eq!(
            ghostty_args(&path, &GhosttyOpenModeDto::Tab),
            vec!["-a", "Ghostty", "/tmp/grove path/workspace one"]
        );
    }

    #[test]
    fn terminal_script_quotes_shell_path() {
        assert_eq!(
            shell_quote("/tmp/grove path/it's here"),
            "'/tmp/grove path/it'\\''s here'"
        );
        let script = terminal_script("Terminal", Path::new("/tmp/grove path/it's here"));
        assert!(script.contains("application \"Terminal\""));
        assert!(script.contains("do script"));
    }
}
