# Contracts 模块

## 职责
`src/shared/contracts/` 放前端和未来后端都能安全导入的共享契约,包括 DTO 类型、输入输出形状、枚举和轻量校验常量。

## 文件
- `worktrees/worktree.contract.ts`:Worktree、Project、setup/archive ProjectCommands、archive policy、workspace root、default branch、CommandDef 和 Density 等 Grove 面板契约。
- `worktrees/index.ts`:Worktrees 契约 barrel。

## 约束
- contracts 不能依赖 React、Tauri、Rust bridge、文件系统、mock repository 或业务用例。
- 新增真实 Tauri/Rust 命令前,共享输入输出类型优先放在这里,再由 presentation/use-case 层消费。
- 当前 Worktree status 仍是面板展示状态,包含 ready/setup/archive/failed;完整后端 lifecycle/operation 模型由 Rust DTO 和 generated bindings 表达。
