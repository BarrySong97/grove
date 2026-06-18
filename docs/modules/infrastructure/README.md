# Infrastructure 模块

## 职责
`src-tauri/src/infrastructure/` 放 Rust 后端的副作用适配器,负责 SQLite、git、Conductor 配置、文件系统、进程执行和 native app 打开等外部边界。

## 文件
- `db/connection.rs`:打开 app data 目录下的 SQLite 数据库并运行 migration。
- `db/repositories/projects_repository.rs`:读写/删除 Grove project、setup/archive 命令和 archive policy 持久化记录;项目列表按最新登记优先返回,旧 run command 行会被忽略。
- `db/repositories/workspaces_repository.rs`:写入导入/刷新得到的 workspace 记录、git state 和 lifecycle/operation 状态,并支持按 active workspace 列出 remove project 候选。
- `db/repositories/operations_repository.rs`:记录 create/setup/archive/remove_project 等操作状态、退出码和日志路径,并提供 latest operation 与运行中 lock 查询。
- `db/repositories/settings_repository.rs`:读写全局 app settings,当前包含默认打开目标、Ghostty 打开模式、默认 archive 策略和 remove project 行为。
- `git/worktree_repository.rs`:运行并解析 `git worktree list --porcelain`,并封装 `git worktree add/remove`。
- `git/status_repository.rs`:读取 dirty/ahead/behind/latest commit 的 git snapshot。
- `conductor/config_repository.rs`:读取 `.conductor/settings*.toml`、user settings 和 legacy `conductor.json` 的 scripts/files-to-copy 配置。
- `filesystem/file_copy.rs`:按 `.worktreeinclude`、`file_include_globs` 或默认 `.env*` 复制 gitignored 文件。
- `process/command_runner.rs`:在 workspace 目录运行 setup/archive command 并写日志;remove project 聚合每个 workspace 的 archive 输出到 project removal log。
- `native/opener.rs`:打开 Finder、Zed、Cursor、VS Code、Ghostty 和 macOS Terminal;Cursor/VS Code 通过 `--new-window <path>` 打开目标目录,Ghostty window 模式通过 `--working-directory=<path>` 设置启动目录,tab 模式通过 macOS folder-open 路径交给 Ghostty 在当前实例中打开。

## 约束
- infrastructure 可以依赖 DTO 和 domain 规则,但 domain/use-case 之外的层不能把 workflow 塞进 repository。
- SQLite 只保存 Grove 状态,不是 git 状态、Conductor 配置或文件系统状态的权威来源。Remove project 只能操作已登记 workspace path,不能扫描整个 workspace root。
- 新增外部副作用适配器时同步对应 use case、typed error 和测试 fixture。
