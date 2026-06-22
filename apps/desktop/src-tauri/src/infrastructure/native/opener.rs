// @purpose Opens workspace paths in supported Finder/editor/terminal targets.
// @role    Native adapter used by open workspace use cases.
// @deps    std process/path, OpenWorkspace target DTO, shared errors
// @gotcha  App CLI args pass paths separately; AppleScript strings must quote paths safely.
use std::path::Path;
use std::process::Command;

use crate::shared::dto::errors::{AppError, AppResult};
use crate::shared::dto::workspaces::OpenWorkspaceTargetDto;

pub(crate) fn open(target: &OpenWorkspaceTargetDto, workspace_path: &Path) -> AppResult<()> {
    match target {
        OpenWorkspaceTargetDto::Finder => open_command(["-R"].as_slice(), Some(workspace_path)),
        OpenWorkspaceTargetDto::Zed => cli_or_app("zed", "Zed", workspace_path),
        OpenWorkspaceTargetDto::Cursor => open_editor("cursor", "Cursor", workspace_path),
        OpenWorkspaceTargetDto::VsCode => open_editor("code", "Visual Studio Code", workspace_path),
        OpenWorkspaceTargetDto::Ghostty => open_ghostty(workspace_path),
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

// Hand the folder to Ghostty as an open-document path. Ghostty's folder open-document
// handler reuses the running instance, opens the workspace in a tab of the current window,
// and sets the working directory explicitly. On macOS there is no supported way to force a
// brand-new window in the running instance from the CLI (the `+new-window` IPC is GTK-only),
// so Grove standardizes on this single reliable behavior.
fn open_ghostty(path: &Path) -> AppResult<()> {
    let status = Command::new("open")
        .arg("-a")
        .arg("Ghostty")
        .arg(path)
        .status()?;
    if status.success() {
        Ok(())
    } else {
        Err(AppError::NativeOpenFailed {
            message: "Failed to open Ghostty.".into(),
        })
    }
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
