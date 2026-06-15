# Domain 模块

## 职责
`src-tauri/src/domain/` 放 Rust 后端无副作用业务规则,例如 Conductor 默认路径、后续 files-to-copy 规则、branch/workspace 名称校验和 archive policy 判断。

## 文件
- `conductor/workspace_paths.rs`:Conductor 默认 workspace root 规则,当前 fallback 为 `~/conductor/workspaces`。

## 约束
- domain 不能读写文件、运行 git、访问 SQLite 或打开 native app。
- filesystem/git/config 探测放在 [Infrastructure 模块](../infrastructure/)。
- 规则变化要同步 spec 或模块文档,避免前后端对业务语义理解不一致。
