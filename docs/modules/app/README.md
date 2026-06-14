# App 模块

## 职责
`src/app/` 是前端应用装配层,负责把 React UI 接到 Tauri 命令。

## 文件
- `src/app/App.tsx`:根组件,注册 Escape 隐藏面板,渲染 `WorktreePanel`。
- `src/app/tauriCommands.ts`:封装 `@tauri-apps/api/core` 的 `invoke`,提供可忽略失败的命令调用。

## 数据流
`App` 不持有业务 state。worktree 状态由 [worktrees 模块](../worktrees/) 管理,Tauri 命令只用于窗口隐藏和退出。

## 约束
- 新增全局快捷键要确认不会和输入框交互冲突。
- 新增 Tauri invoke 前先读 [Tauri runtime 文档](../tauri-runtime/)。
- `invokeQuietly` 只适合隐藏/退出这类可忽略失败命令;用户操作失败不能静默吞掉。
