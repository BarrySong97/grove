# Worktree 命令模拟边界

当前 Grove 的 worktree 行为是前端原型模拟,不是实际 git 或 shell 执行。

## 现在已经有的行为
- `createWorktree` 会创建一个 draft worktree,状态先是 `setting-up`,延迟后变成 `ready`。
- `archiveWorktree` 会把目标 worktree 标记为 `archiving`,延迟后从前端 state 中移除。
- `runCommand` 只展示 toast;只有 `setup` 会临时切换 busy 状态。
- `ProjectSettings` 修改的是内存中的 command 字符串。

## 还没有的行为
- 没有调用 `git worktree`。
- 没有执行用户配置的 shell command。
- 没有项目目录选择、持久化存储或真实文件系统扫描。
- 没有处理命令失败、取消、日志输出和并发锁。

## 接入真实后端前的要求
- 先写 spec 或 plan,说明命令执行模型、权限、日志、失败恢复和安全边界。
- Rust 侧命令必须显式注册到 Tauri handler,并同步 capability。
- UI 侧必须区分 queued/running/succeeded/failed/cancelled 等状态,不能复用当前 `ready | setting-up | archiving` 作为完整任务模型。
- 涉及删除 worktree 或执行用户命令时,必须有确认和可恢复策略。
