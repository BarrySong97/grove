# Worktrees 模块

## 职责
`src/modules/worktrees/` 拥有 Grove 的核心面板原型:项目列表、worktree 行、排序、新建、归档、命令菜单和项目命令设置。

## 目录
- `components/`:面板、项目组、worktree 行、右键菜单、设置页和局部编辑器。
- `api/`:前端到 Rust 业务 command 的薄 wrapper,包含项目列表、Conductor 导入、创建、归档、打开和项目设置 API。
- `hooks/useWorktreePanelState.ts`:前端 presentation hook,持有 React state、toast,并调用 Rust API 与少量纯前端用例。
- `domain/`:纯 Worktree 规则、派生标签和命令 catalog。
- `use-cases/`:项目/worktree 排序、当前选择和 run command UI 状态的纯状态变换;真实 git/shell/persistence workflow 在 Rust 后端。
- `index.ts`:模块对外导出。

## 状态模型
- `Project` 包含项目路径、accent、命令配置和 worktrees。
- `WorktreeStatus` 当前只有 `ready | setting-up | archiving`。
- 项目/workspace 列表通过 `api/` 调用 Rust generated command,来自 SQLite、Conductor import 和 git refresh。
- `createWorktree` 调用 Rust `create_workspace`,执行真实 `git worktree add`、files-to-copy 和 setup command。
- `archiveWorktree` 调用 Rust `archive_workspace`,执行 archive command 并按项目策略 hide 或 `git worktree remove`。
- `openWorktree` 调用 Rust `open_workspace`,打开 Finder、Zed、Cursor、VS Code、Ghostty 或 macOS Terminal。
- `runCommand` 仍是前端占位反馈;当前第一轮只解析/展示 run command,不做长期进程管理。
- Worktree/Project 等共享类型来自 `src/shared/contracts/worktrees/`,模块内部不得重新定义一份业务类型。

## 分层
- 组件和 hook 属于前端 presentation,只编排 UI 事件、React state 和浮层反馈。
- `use-cases/` 表达一次用户操作造成的项目列表变化,保持纯函数,方便后续补单元测试。
- `domain/` 只放无副作用规则,例如 busy 状态判断、当前 worktree 选择和 draft worktree 构造。
- `api/` 只能调用 [Bindings 模块](../bindings/) 暴露的 generated command,不要直接拼 Tauri command 字符串。
- 前端 use-case 中的排序、当前选择和 run command 只是临时 UI 状态变换,不能当成真实 git/worktree 操作。

## 交互
- 项目和 worktree 都用 `@dnd-kit` 支持拖拽排序。
- 项目和 worktree 都提供按钮式 move up/down/top,动画配置来自 `src/shared/lib/sortable.ts`。
- 右键菜单支持 open/reveal/copy/run/archive 等入口;open/archive 已接 Rust command,run 仍是占位反馈。
- 右键菜单使用 `menu-surface` 低透明度磨砂玻璃,避免浮层读起来过透明。
- worktree 行的 hover actions 在对应右键/More 菜单打开期间保持可见,避免菜单浮层出现后触发行级操作消失。
- Run Command 操作在同一个菜单内以分组标题 + 命令项展示,不再使用二级 submenu。
- Grove 不建模用户“当前” worktree;`current` 仅兼容旧前端状态,后端不会依赖它做 archive 判断。

## 约束
- 接入真实 git/worktree 前,先更新 [Worktree 命令模拟边界](../../topics/worktree-command-simulation.md) 或新增 spec/plan。
- 不要在组件里直接构造跨模块共享样式工具;先看 `src/shared/ui/` 和 `src/shared/lib/`。
- `ProjectSettings` 保存 Grove override:workspace root、archive policy、setup/archive/run 命令;它不会回写 Conductor 配置文件。
- TypeScript/TSX 源码纳入根级 Oxlint/Oxfmt;纯格式化 diff 不改变临时模拟操作边界。
