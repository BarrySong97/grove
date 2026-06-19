# App 模块

## 职责
`src/app/` 是前端应用装配层,负责把 React UI 接到 Tauri 命令和全局异步状态客户端。

## 文件
- `src/main.tsx`:Vite/React 浏览器入口,只负责挂载 `App` 和全局 CSS。
- `src/index.css`:全局 Tailwind + Hero UI v3 样式入口、透明窗口壳、玻璃 surface、Hero theme 覆盖和菜单浮层 token。
- `src/app/App.tsx`:根组件,初始化前端 i18n,注册 Escape 隐藏面板,装配 TanStack Query provider 并渲染 `WorktreePanel`。
- `src/app/queryClient.ts`:创建全局 TanStack Query client,用于 Rust-backed async state 的前端编排。
- `src/app/tauriCommands.ts`:封装 `@tauri-apps/api/core` 的 `invoke`,提供可忽略失败的命令调用。

## 数据流
`App` 不持有业务 state。worktree 状态和语言设置由 [worktrees 模块](../worktrees/) 管理,Tauri 命令只用于窗口隐藏和退出。TanStack Query client 在这里提供,但项目/workspace/settings 的真实来源仍是 Rust/SQLite/git。

## 约束
- 新增全局快捷键要确认不会和输入框交互冲突。
- `src/main.tsx` 保持极薄,不要把业务装配或状态放在这里。
- `queryClient` 只做 Rust-backed 读写的短生命周期编排;不要把 query cache 当成 git 或 SQLite 的权威状态。
- Hero UI 默认 theme 不能覆盖 tray webview 的透明背景;相关变量必须在 `src/index.css` 中显式收敛到 Grove token。
- 新增 Tauri invoke 前先读 [Tauri runtime 文档](../tauri-runtime/)。
- `invokeQuietly` 只适合隐藏/退出这类可忽略失败命令;用户操作失败不能静默吞掉。
