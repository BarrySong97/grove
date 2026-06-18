# Tauri Runtime 模块

## 职责
`src-tauri/src/` 是桌面运行壳和 Rust 业务后端,负责 Tauri app 启动、macOS tray、窗口透明、panel 定位、SQLite 状态和前端可调用命令。

## 文件
- `main.rs`:二进制入口,调用 library run。
- `build.rs`:Cargo build script,运行 Tauri build-time codegen。
- `lib.rs`:Tauri builder、`tauri-specta` typed invoke handler、SQLite setup、bindings export 和窗口事件。
- `commands.rs`:运行壳命令,当前是 `hide_panel` 与 `quit_app`。
- `app_state.rs`:Tauri managed state,保存 SQLite pool 和 native dialog lifecycle guard。
- `shared/dto/`:Rust command DTO 和 typed error,由 `specta` 导出到 TypeScript。
- `presentation/commands/`:业务 Tauri command handler,保持薄封装,包括 projects/workspaces/settings/operations。
- `use_cases/`:业务 workflow,例如项目列表、Conductor 导入、项目设置、创建/归档/retry/remove/open workspace。
- `infrastructure/db/`:SQLite 连接、migration 和 repository。
- `migrations/`:SQLite schema migration。
- `tray.rs`:tray icon、menu 和显示/隐藏 panel 的交互。
- `positioning.rs`:根据 tray rect、点击位置和 monitor work area 定位 panel。
- `window.rs`:macOS WKWebView/NSWindow 透明背景配置,以及 Add project 使用的 Rust 侧 Tauri dialog 文件夹选择器。
- `tray_icon.rs`:运行时生成 template tray icon。
- `icons/32x32.png`、`icons/128x128.png`、`icons/128x128@2x.png`、`icons/icon.icns`、`icons/icon.ico`:Tauri desktop bundle 使用的 app 图标集。
- `icons/icon.png`:Tauri icon generator 产出的 PNG app icon。
- `icons/Grove.svg`:app 图标主矢量源。
- `icons/menubar/`:备用 menu bar 图标资源;当前运行时 menu bar 图标仍由 `tray_icon.rs` 生成。

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
- SQLite 只保存 Grove 项目登记、用户选择、全局 app settings、workspace lifecycle/operation 状态和 operation log metadata。
- Mutating command 必须在 Rust use case/repository 层检查 operation lock;前端 disabled 状态不能作为安全边界。
- Git 状态、Conductor 配置和文件系统状态以真实来源为准,后续 refresh/import use case 负责同步。
- 前端业务代码优先通过生成的 [Bindings 模块](../bindings/) 调用 Rust command,不要手写业务 `invoke(...)` 字符串。
- Add project 文件夹选择在 Rust runtime 侧调用 `tauri-plugin-dialog`,返回 git repo 根目录后再交给项目 use case 登记;前端不直接调用 dialog plugin,也不临时切换 Dock 或 app activation policy。

## 约束
- macOS 透明配置包含 unsafe Objective-C bridge,改动必须运行 `pnpm tauri:dev` 真机验证。
- `build.rs` 保持薄封装;新增 codegen 或资源处理时要解释输入、输出和失败方式。
- app 图标从 `src-tauri/icons/icon.png` 通过 `pnpm tauri icon <source.png>` 生成标准 Tauri 图标集;macOS bundle 依赖 `icons/icon.icns`。Dock/app 图标源图保持透明画布,主体约占 82%,例如 512 画布内主体 420、边距 46。
- macOS 启动时设置 `ActivationPolicy::Accessory`,所以 app 作为 menu bar 应用运行,Dock 图标会在启动后隐藏;app icon 主要体现在 Finder/Applications 的 `.app` bundle 上。
- `position_panel` 必须处理多显示器、缩放和 work area clamp。
- CloseRequested 会隐藏窗口;Focused(false) 只有在 panel 已经收到过焦点且没有 native dialog 打开时才隐藏,避免打开瞬间或系统文件夹选择器焦点切换把 panel/dialog 一起吞掉。不要改成直接退出。
- Add project 登记失败会在 `pnpm tauri:dev` 终端输出 `[grove] add project failed: ...`,用于区分用户取消、非 git repo 和 SQLite/git 错误。
- 改 DTO 或 command 后必须运行 `cargo test export_bindings`,并把生成的 TypeScript bindings 纳入检查。
- menu bar 图标通过 `TrayIconBuilder::icon_as_template(true)` 交给 macOS 自动着色;替换运行时绘制逻辑或备用资源时必须保持 alpha-only/template-safe glyph。
