# Bindings 模块

## 职责
`src/shared/bindings/` 放从 Rust 后端导出的 TypeScript bindings,让前端通过类型安全的 Tauri command wrapper 调用业务后端。

## 文件
- `commands.ts`:由 `tauri-specta` 从 Rust DTO 和 Tauri commands 生成,包含 `commands.*` wrapper 和 DTO 类型。

## 约束
- 不要手工编辑生成文件;运行 Rust `export_bindings` 测试或启动 debug Tauri app 重新生成。
- 新增 Rust command 或 DTO 后必须重新生成本文件;例如 Add project UI 使用 `commands.addProjectFromFolderPicker`,operation UI 使用 `commands.getLatestOperation`/`commands.readOperationLog`,全局 settings DTO 暴露 `language`、`hoverQuickOpenTargets`、`defaultArchivePolicy`、`removeProjectBehavior` 和 `newProjectPosition`。
- 前端业务 API wrapper 应放在业务模块的 `api/` 目录,不要在组件里直接散落 generated command 调用。
- 生成文件必须保留 `@purpose` 文件头,否则 `node scripts/check-docs.mjs` 会失败。
