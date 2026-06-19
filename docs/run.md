# 运行手册

## 环境要求
- Node.js:按 Vite/Tauri 2 支持版本使用,建议 Node 20+。
- 包管理:pnpm 10,项目声明在 `package.json` 的 `packageManager`。
- Rust/Tauri:需要本机 Rust toolchain 和 Tauri 2 桌面依赖。
- 平台:当前窗口透明和 menu bar 行为主要按 macOS 验证。

## 安装
```bash
pnpm install
```

## 本地启动
```bash
pnpm dev
```

只启动 Vite 前端,默认地址是 `http://127.0.0.1:1420`。

```bash
pnpm tauri:dev
```

启动完整 Tauri tray app。dev 脚本会加载 `src-tauri/tauri.dev.conf.json`,使用 `Grove Dev` / `com.seperate.grove.dev`,因此 app data 目录和安装版 `Grove` / `com.seperate.grove` 分开。macOS 下应用以 accessory activation policy 运行,通过菜单栏图标显示或隐藏面板。

## 构建
```bash
pnpm build
```

执行 TypeScript 类型检查并构建前端静态资源。

```bash
pnpm tauri:build
```

构建桌面应用包。release 使用正式 identifier `com.seperate.grove`。

```bash
pnpm packages
```

构建 release 包、退出正在运行的 `Grove`、把 `Grove.app` 重装到 `/Applications` 并重新打开。

## Lint 与格式化
```bash
pnpm lint
pnpm format
pnpm format:check
```

`pnpm lint` 使用 Oxlint。`pnpm format` 使用 Oxfmt 写回文件,`pnpm format:check` 只检查不写入。Oxfmt 配置见 `.oxfmtrc.json`,当前排除 docs 和 Tauri Rust 壳,避免和现有文档风格、Rust 工具链混在一起。

## 测试与验证
当前仓库还没有独立 test 脚本。收尾至少运行:

```bash
pnpm format:check
pnpm lint
pnpm build
node scripts/check-docs.mjs
```

涉及 Tauri 窗口、托盘、透明背景或 Rust 命令时,还要运行:

```bash
pnpm tauri:dev
```

并手动验证托盘点击、窗口失焦隐藏、Escape 隐藏、Quit 退出。

## 文档同步检查
```bash
node scripts/check-docs.mjs
node scripts/check-docs.mjs --strict
```

`--strict` 会把文档漂移警告也当成失败,适合提交前或 CI。
