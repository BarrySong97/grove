# Worktrees 模块

## 职责
`src/modules/worktrees/` 拥有 Grove 的核心面板原型:项目列表、worktree 行、排序、新建、归档、命令菜单和项目命令设置。

## 目录
- `components/`:面板、项目组、worktree 行、右键菜单、设置页和局部编辑器。
- `hooks/useWorktreePanelState.ts`:面板内存状态机和交互动作。
- `model/`:类型、mock 数据、命令定义和 selector/helper。
- `index.ts`:模块对外导出。

## 状态模型
- `Project` 包含项目路径、accent、命令配置和 worktrees。
- `WorktreeStatus` 当前只有 `ready | setting-up | archiving`。
- `createWorktree`、`archiveWorktree`、`runCommand` 是前端延迟模拟,没有真实 shell/git 调用。

## 交互
- 项目和 worktree 都用 `@dnd-kit` 支持拖拽排序。
- 项目和 worktree 都提供按钮式 move up/down/top,动画配置来自 `src/shared/lib/sortable.ts`。
- 右键菜单支持 open/reveal/copy/run/archive 等入口,其中多数当前只是 UI 占位或 toast。
- 当前 worktree 不允许 archive。

## 约束
- 接入真实 git/worktree 前,先更新 [Worktree 命令模拟边界](../../topics/worktree-command-simulation.md) 或新增 spec/plan。
- 不要在组件里直接构造跨模块共享样式工具;先看 `src/shared/ui/` 和 `src/shared/lib/`。
- `ProjectSettings` 修改的是内存 command,不要承诺持久化。
