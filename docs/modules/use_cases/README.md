# Use Cases 模块

## 职责
`src-tauri/src/use_cases/` 放 Rust 后端业务 workflow,表达用户或系统的一次完整动作。

## 文件
- `projects/list_projects.rs`:从持久化层按最新登记优先读取已登记项目。
- `projects/create_project.rs`:从用户选择的 git repo 文件夹登记 Grove project,并推断默认 workspace root、branch 和命令配置。
- `projects/import_conductor_projects.rs`:扫描 Conductor workspace root,读取 git/config 并写入 Grove DB。
- `projects/list_worktree_projects.rs`:组合项目、命令和 workspace 列表给前端面板,继承项目列表的最新登记优先顺序。
- `projects/update_project_settings.rs`:保存 Grove override 的 workspace root、命令和 archive policy。
- `settings/get_app_settings.rs`:读取全局 app settings。
- `settings/update_app_settings.rs`:保存全局 app settings,当前影响 Ghostty 打开 workspace 的 window/tab 行为。
- `workspaces/refresh_project.rs`:刷新真实 git worktree metadata,并把缺失的 active workspace 标记为 stale。
- `workspaces/create_workspace.rs`:创建 git worktree、复制 ignored 文件并运行 setup command;失败时把已写入的 workspace operation status 标记为 failed,避免 UI 保持 setting-up。
- `workspaces/archive_workspace.rs`:运行 archive command,按策略 hide 或 `git worktree remove`。
- `workspaces/open_workspace.rs`:读取全局 settings 后调用 native opener 打开 Finder/editor/terminal。
- `projects/mod.rs`:project use-case barrel。

## 约束
- use case 可以编排 domain 规则和 infrastructure adapter。
- Tauri command handler 不拥有 workflow;repository 不反向调用 use case。
- 长操作必须写 operation 状态和日志路径,避免 UI 只能看到静默失败。
