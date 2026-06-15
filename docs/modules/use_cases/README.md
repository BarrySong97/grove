# Use Cases 模块

## 职责
`src-tauri/src/use_cases/` 放 Rust 后端业务 workflow,表达用户或系统的一次完整动作。

## 文件
- `projects/list_projects.rs`:从持久化层读取已登记项目。
- `projects/import_conductor_projects.rs`:扫描 Conductor workspace root,读取 git/config 并写入 Grove DB。
- `projects/list_worktree_projects.rs`:组合项目、命令和 workspace 列表给前端面板。
- `projects/update_project_settings.rs`:保存 Grove override 的 workspace root、命令和 archive policy。
- `workspaces/refresh_project.rs`:刷新真实 git worktree metadata,并把缺失的 active workspace 标记为 stale。
- `workspaces/create_workspace.rs`:创建 git worktree、复制 ignored 文件并运行 setup command。
- `workspaces/archive_workspace.rs`:运行 archive command,按策略 hide 或 `git worktree remove`。
- `workspaces/open_workspace.rs`:调用 native opener 打开 Finder/editor/terminal。
- `projects/mod.rs`:project use-case barrel。

## 约束
- use case 可以编排 domain 规则和 infrastructure adapter。
- Tauri command handler 不拥有 workflow;repository 不反向调用 use case。
- 长操作必须写 operation 状态和日志路径,避免 UI 只能看到静默失败。
