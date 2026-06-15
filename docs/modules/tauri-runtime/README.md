# Tauri Runtime 模块

## 职责
`src-tauri/src/` 是桌面运行壳和 Rust 业务后端,负责 Tauri app 启动、macOS tray、窗口透明、panel 定位、SQLite 状态和前端可调用命令。

## 文件
- `main.rs`:二进制入口,调用 library run。
- `build.rs`:Cargo build script,运行 Tauri build-time codegen。
- `lib.rs`:Tauri builder、`tauri-specta` typed invoke handler、SQLite setup、bindings export 和窗口事件。
- `commands.rs`:运行壳命令,当前是 `hide_panel` 与 `quit_app`。
- `app_state.rs`:Tauri managed state,当前保存 SQLite pool。
- `shared/dto/`:Rust command DTO 和 typed error,由 `specta` 导出到 TypeScript。
- `presentation/commands/`:业务 Tauri command handler,保持薄封装。
- `use_cases/`:业务 workflow,例如项目列表、Conductor 导入、项目设置、创建/归档/open workspace。
- `infrastructure/db/`:SQLite 连接、migration 和 repository。
- `migrations/`:SQLite schema migration。
- `tray.rs`:tray icon、menu 和显示/隐藏 panel 的交互。
- `positioning.rs`:根据 tray rect、点击位置和 monitor work area 定位 panel。
- `window.rs`:macOS WKWebView/NSWindow 透明背景配置,非 macOS 为空实现。
- `tray_icon.rs`:运行时生成 template tray icon。

## 前后端命令链路
新增命令时同步:

1. Rust DTO 和 typed error,必要时 derive `serde` 与 `specta::Type`。
2. Rust 函数和 `#[tauri::command]` / `#[specta::specta]`。
3. `src-tauri/src/lib.rs` 的 `tauri_specta::collect_commands!`。
4. `src-tauri/capabilities/default.json` 的权限或 capability,如果命令引入新的 Tauri/plugin 权限。
5. 重新生成 `src/shared/bindings/commands.ts`。
6. 前端业务模块 `api/` wrapper 或调用点。
7. 本文档和相关文件头。

## 数据边界
- SQLite 只保存 Grove 项目登记、用户选择、workspace lifecycle/operation 状态和 operation log metadata。
- Git 状态、Conductor 配置和文件系统状态以真实来源为准,后续 refresh/import use case 负责同步。
- 前端业务代码优先通过生成的 [Bindings 模块](../bindings/) 调用 Rust command,不要手写业务 `invoke(...)` 字符串。

## 约束
- macOS 透明配置包含 unsafe Objective-C bridge,改动必须运行 `pnpm tauri:dev` 真机验证。
- `build.rs` 保持薄封装;新增 codegen 或资源处理时要解释输入、输出和失败方式。
- `position_panel` 必须处理多显示器、缩放和 work area clamp。
- CloseRequested 和 Focused(false) 都会隐藏窗口,不要改成直接退出。
- 改 DTO 或 command 后必须运行 `cargo test export_bindings`,并把生成的 TypeScript bindings 纳入检查。
