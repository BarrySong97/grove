# Infrastructure 模块

## 职责
`src-tauri/src/infrastructure/` 放 Rust 后端的副作用适配器,负责 SQLite、git、Conductor 配置、文件系统、进程执行和 native app 打开等外部边界。

## 文件
- `db/connection.rs`:打开 app data 目录下的 `grove.sqlite` 并运行 migration;dev/release 通过不同 Tauri identifier 进入不同 app data 目录。
- `db/repositories/projects_repository.rs`:读写/删除 Grove project、setup/archive 命令和 archive policy 持久化记录;项目列表按最新登记优先返回,旧 run command 行会被忽略;`upsert_config_command` 写入 Conductor 来源命令时带 `source != 'grove_override'` 守卫,不覆盖用户手动编辑。
- `db/repositories/workspaces_repository.rs`:写入导入/刷新得到的 workspace 记录、git state 和 lifecycle/operation 状态,并支持按 active workspace 列出 remove project 候选。
- `db/repositories/operations_repository.rs`:记录 create/setup/archive/remove_project 等操作状态、退出码和日志路径,并提供 latest operation 与运行中 lock 查询。
- `db/repositories/settings_repository.rs`:读写全局 app settings,当前包含语言、悬停快捷打开目标、默认 archive 策略、remove project 行为和新项目列表位置。
- `git/worktree_repository.rs`:运行并解析 `git worktree list --porcelain`,识别 prunable worktree,并封装 `git worktree add/remove/prune`。
- `git/status_repository.rs`:读取 dirty/ahead/behind/latest commit 的 git snapshot。
- `conductor/config_repository.rs`:按字段合并 `.conductor/settings(.local).toml`、repo `conductor.json` 与全局 `~/.conductor/settings.toml` 的 scripts/files-to-copy 配置——每个字段取优先级最高且定义了该字段的文件,高优先级文件缺该字段则回退,避免 `settings.local.toml` 遮住 `conductor.json` 的 setup/archive。
- `filesystem/file_copy.rs`:按 `.worktreeinclude`、`file_include_globs` 或默认 `.env*` 复制 gitignored 文件。
- `process/command_runner.rs`:在 workspace 目录运行 setup/archive command 并写日志;remove project 聚合每个 workspace 的 archive 输出到 project removal log。
- `native/opener.rs`:打开 Finder、Zed、Cursor、VS Code、Ghostty 和 macOS Terminal;Cursor/VS Code 通过 `--new-window <path>` 打开目标目录。Ghostty 统一用 `open -a Ghostty <path>`——把目录交给 Ghostty 的 folder open-document handler,复用当前实例、在当前窗口开一个 tab 并显式设置工作目录。macOS 上没有从 CLI 在现有实例里强开「指定目录新窗口」的官方途径(`+new-window` 的 native IPC 仅 GTK 支持;`open -n` 从 accessory 应用发起会被 LaunchServices 合并成 tab,且独立进程会在 Dock 里各占一个图标),因此 Grove 不再提供 window/tab 开关,统一走 tab 行为。

## 约束
- infrastructure 可以依赖 DTO 和 domain 规则,但 domain/use-case 之外的层不能把 workflow 塞进 repository。
- SQLite 只保存 Grove 状态,不是 git 状态、Conductor 配置或文件系统状态的权威来源。Remove project 只能操作已登记 workspace path,不能扫描整个 workspace root。
- 新增外部副作用适配器时同步对应 use case、typed error 和测试 fixture。
