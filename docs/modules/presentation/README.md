# Presentation 模块

## 职责
`src-tauri/src/presentation/` 放 Rust 后端的 Tauri command 传输适配层,把前端请求转给 use case。

## 文件
- `commands/projects.rs`:project 相关业务 command,包含 `add_project_from_folder_picker`、`create_project`、`list_projects`、`list_worktree_projects`、`import_conductor_projects`、`remove_project` 和 `update_project_settings`。
- `commands/operations.rs`:operation 查询和日志读取 command,包含 `get_latest_operation` 和 `read_operation_log`。
- `commands/settings.rs`:全局 app settings command,包含 `get_app_settings` 和 `update_app_settings`。
- `commands/workspaces.rs`:workspace 相关业务 command,包含 `refresh_project`、`create_workspace`、`archive_workspace`、`retry_workspace_operation` 和 `open_workspace`。
- `commands/mod.rs`:业务 command barrel。

## 约束
- command handler 保持薄封装:读取 Tauri state、调用 use case、映射 typed error。
- 新 command 必须加 `#[tauri::command]` 与 `#[specta::specta]`,并注册到 `src-tauri/src/lib.rs` 的 `collect_commands!`。
- 不要在 presentation 层直接执行 git、SQL、文件复制或 native app 打开。
- `add_project_from_folder_picker` 只负责持有 native dialog lifecycle guard、调用 runtime 文件夹选择器、输出用户选择/失败诊断日志,并把路径交给 `create_project` use case;项目登记、git 校验和 SQLite 写入仍必须留在 use case/repository 层。
