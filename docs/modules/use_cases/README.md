# Use Cases 模块

## 职责
`src-tauri/src/use_cases/` 放 Rust 后端业务 workflow,表达用户或系统的一次完整动作。

## 文件
- `projects/list_projects.rs`:从持久化层按最新登记优先读取已登记项目。
- `projects/create_project.rs`:从用户选择的 git repo 文件夹登记 Grove project,推断默认 workspace root、branch 和命令配置,并写入受保护的 repo root workspace。
- `projects/import_conductor_projects.rs`:扫描 Conductor workspace root,读取 git/config 并写入 Grove DB;导入结果包含 repo root 和 workspace root 下的有效 worktree。
- `projects/list_worktree_projects.rs`:组合项目、setup/archive 命令和 workspace 列表给前端面板,继承项目列表的最新登记优先顺序;每次加载会重读 Conductor 配置回填 setup/archive(经守卫保留 `grove_override` 手动编辑),让已有项目无需重新导入也能拿到命令。
- `projects/remove_project.rs`:从 Grove 移除项目,并按全局 remove behavior 可选地对 active managed worktree 逐个执行 archive command 和 `git worktree remove`;主 repo 目录永不删除,缺失/损坏 workspace 不阻塞 Grove 记录移除。
- `projects/update_project_settings.rs`:保存 Grove override 的 workspace root、命令和 archive policy。
- `settings/get_app_settings.rs`:读取全局 app settings。
- `settings/update_app_settings.rs`:保存全局 app settings,当前影响语言、悬停快捷打开目标、Ghostty 打开 workspace 的 window/tab 行为、默认 archive 策略、remove project 行为和新项目列表位置。
- `workspaces/refresh_project.rs`:刷新真实 git worktree metadata,包含 repo root,跳过 prunable/损坏路径,并把缺失的 active workspace 标记为 stale。
- `workspaces/create_workspace.rs`:创建 git worktree、复制 ignored 文件并运行 setup command;失败时把已写入的 workspace operation status 标记为 failed,避免 UI 保持 setting-up。
- `workspaces/archive_workspace.rs`:保护 repo root,对有效 workspace 运行 archive command 并按策略 hide 或 `git worktree remove`;对 stale、缺失或损坏 workspace 直接隐藏 Grove 记录并尝试 `git worktree prune`。
- `workspaces/retry_workspace_operation.rs`:重试最新 failed setup/create 或 archive workflow;setup retry 不重复 `git worktree add`。
- `workspaces/open_workspace.rs`:读取全局 settings 后调用 native opener 打开 Finder/editor/terminal,其中 Ghostty 目标会应用全局 window/tab 设置。
- `projects/mod.rs`:project use-case barrel。

## 约束
- use case 可以编排 domain 规则和 infrastructure adapter。
- Tauri command handler 不拥有 workflow;repository 不反向调用 use case。
- 长操作必须写 operation 状态和日志路径,避免 UI 只能看到静默失败;mutating workflow 必须在后端检查 project/workspace operation lock。
