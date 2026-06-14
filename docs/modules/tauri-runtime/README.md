# Tauri Runtime 模块

## 职责
`src-tauri/src/` 是桌面运行壳,负责 Tauri app 启动、macOS tray、窗口透明、panel 定位和前端可调用命令。

## 文件
- `main.rs`:二进制入口,调用 library run。
- `build.rs`:Cargo build script,运行 Tauri build-time codegen。
- `lib.rs`:Tauri builder、invoke handler、setup 和窗口事件。
- `commands.rs`:前端可调用命令,当前是 `hide_panel` 与 `quit_app`。
- `tray.rs`:tray icon、menu 和显示/隐藏 panel 的交互。
- `positioning.rs`:根据 tray rect、点击位置和 monitor work area 定位 panel。
- `window.rs`:macOS WKWebView/NSWindow 透明背景配置,非 macOS 为空实现。
- `tray_icon.rs`:运行时生成 template tray icon。

## 前后端命令链路
新增命令时同步:

1. Rust 函数和 `#[tauri::command]`。
2. `src-tauri/src/lib.rs` 的 `generate_handler!`。
3. `src-tauri/capabilities/default.json` 的权限或 capability。
4. 前端 `src/app/tauriCommands.ts` 或调用点。
5. 本文档和相关文件头。

## 约束
- macOS 透明配置包含 unsafe Objective-C bridge,改动必须运行 `pnpm tauri:dev` 真机验证。
- `build.rs` 保持薄封装;新增 codegen 或资源处理时要解释输入、输出和失败方式。
- `position_panel` 必须处理多显示器、缩放和 work area clamp。
- CloseRequested 和 Focused(false) 都会隐藏窗口,不要改成直接退出。
