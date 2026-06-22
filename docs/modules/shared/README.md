# Rust Shared 模块

## 职责
`src-tauri/src/shared/` 放 Rust 后端跨层共享类型,当前主要是 command DTO 和 typed error。

## 文件
- `dto/projects.rs`:Project、create/update/remove input、config source、archive policy DTO。
- `dto/workspaces.rs`:Workspace、lifecycle、operation、retry input 和 git state DTO。
- `dto/operations.rs`:operation、operation target 和 log DTO。
- `dto/conductor.rs`:Conductor import candidate DTO。
- `dto/settings.rs`:全局 app settings DTO,当前包含语言、悬停快捷打开目标、默认 archive 策略、remove project 行为和新项目列表位置(`NewProjectPositionDto`)。
- `dto/errors.rs`:业务 command typed error。

## 约束
- DTO 是 command API 契约,不是数据库 row 或 domain object。
- 前端可见类型必须 derive `serde` 和 `specta::Type`,并通过 `tauri-specta` 导出到 [Bindings 模块](../bindings/)。
- 错误 message 要适合 UI 展示,长日志和敏感命令输出只通过 log path 暴露。
