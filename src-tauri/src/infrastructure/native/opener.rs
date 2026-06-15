// @purpose Opens workspace paths in supported Finder/editor/terminal targets.
// @role    Native adapter used by open workspace use cases.
// @deps    std process/path, OpenWorkspace target DTO, shared errors
// @gotcha  AppleScript strings must quote paths safely; command args pass paths separately.
use std::path::Path;
use std::process::Command;

use crate::shared::dto::errors::{AppError, AppResult};
use crate::shared::dto::workspaces::OpenWorkspaceTargetDto;

pub(crate) fn open(target: &OpenWorkspaceTargetDto, workspace_path: &Path) -> AppResult<()> {
    match target {
        OpenWorkspaceTargetDto::Finder => open_command(["-R"].as_slice(), Some(workspace_path)),
        OpenWorkspaceTargetDto::Zed => cli_or_app("zed", "Zed", workspace_path),
        OpenWorkspaceTargetDto::Cursor => cli_or_app("cursor", "Cursor", workspace_path),
        OpenWorkspaceTargetDto::VsCode => cli_or_app("code", "Visual Studio Code", workspace_path),
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

fn open_ghostty(path: &Path) -> AppResult<()> {
    let args = ghostty_args(path);
    let status = Command::new("open").args(args).status()?;
    if status.success() {
        Ok(())
    } else {
        Err(AppError::NativeOpenFailed {
            message: "Failed to open Ghostty.".into(),
        })
    }
}

fn ghostty_args(path: &Path) -> Vec<String> {
    vec![
        "-n".into(),
        "-a".into(),
        "Ghostty".into(),
        "--args".into(),
        "-e".into(),
        "/bin/zsh".into(),
        "-lc".into(),
        ghostty_shell_command(path),
    ]
}

fn ghostty_shell_command(path: &Path) -> String {
    format!(
        "cd {}; exec ${{SHELL:-/bin/zsh}} -l",
        shell_quote(&path.to_string_lossy())
    )
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
    fn ghostty_args_keep_space_path_as_single_argument() {
        let path = PathBuf::from("/tmp/grove path/workspace one");
        assert_eq!(
            ghostty_args(&path),
            vec![
                "-n",
                "-a",
                "Ghostty",
                "--args",
                "-e",
                "/bin/zsh",
                "-lc",
                "cd '/tmp/grove path/workspace one'; exec ${SHELL:-/bin/zsh} -l"
            ]
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
