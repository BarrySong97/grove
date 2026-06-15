# Presentation 模块

## 职责
`src-tauri/src/presentation/` 放 Rust 后端的 Tauri command 传输适配层,把前端请求转给 use case。

## 文件
- `commands/projects.rs`:project 相关业务 command,包含 `list_projects`、`list_worktree_projects`、`import_conductor_projects` 和 `update_project_settings`。
- `commands/workspaces.rs`:workspace 相关业务 command,包含 `refresh_project`、`create_workspace`、`archive_workspace` 和 `open_workspace`。
- `commands/mod.rs`:业务 command barrel。

## 约束
- command handler 保持薄封装:读取 Tauri state、调用 use case、映射 typed error。
- 新 command 必须加 `#[tauri::command]` 与 `#[specta::specta]`,并注册到 `src-tauri/src/lib.rs` 的 `collect_commands!`。
- 不要在 presentation 层直接执行 git、SQL、文件复制或 native app 打开。
