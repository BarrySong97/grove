# Tooling 模块

## 职责
工具链模块记录项目启动、构建、文档检查和 agent hooks 的配置入口。它不是业务运行时,但会影响所有开发和验证流程。

## 文件
- `vite.config.ts`:Vite 配置,启用 React 与 Tailwind 插件,固定 dev server 为 `127.0.0.1:1420`。
- `vitest.config.ts`:Vitest 配置,使用 React plugin 和 jsdom 环境跑前端单元测试。
- `src/vite-env.d.ts`:Vite client ambient 类型声明。
- `package.json`:脚本、依赖和 pnpm packageManager 声明。
- `.oxfmtrc.json`:Oxfmt 配置入口,排除 docs / Tauri Rust 壳等非前端格式化范围。
- `check-docs.config.json`:harness 文档检查范围和忽略规则。
- `scripts/check-docs.mjs`:AI-Doc-System 防漂移 sensor。
- `scripts/hooks/`:Claude/Codex/git 共享 hook 脚本。
- `.claude/settings.json`:Claude Code hook 配置。
- `.codex/hooks.json`、`.codex/config.toml`:Codex hook 配置。

## 命令关系
- `pnpm dev` 只跑 Vite 前端,用于快速 UI 验证。
- `pnpm tauri:dev` 跑完整桌面壳,需要 Vite 端口契约不变。
- `pnpm build` 先 `tsc --noEmit`,再 `vite build`。
- `pnpm test` 使用 Vitest 跑 `src/**/*.test.{ts,tsx}` 前端单元测试。
- `pnpm lint` 使用 Oxlint 扫描项目 JS/TS/TSX 文件,提交前作为兜底。
- `pnpm format` 使用 Oxfmt 写回前端源码、配置和 hook 支持的文本文件;`pnpm format:check` 只检查不写入。
- `scripts/hooks/format-lint.mjs` 在 Write/Edit 后对单文件跑 Oxfmt,并对 JS/TS 文件追加 Oxlint。
- `node scripts/check-docs.mjs --hook` 是 Stop hook 专用模式:成功只输出 `{}`,失败只输出 `{"decision":"block","reason":"..."}`,不能打印普通日志或 `hookSpecificOutput`。
- `scripts/hooks/pre-commit` 跑 `node scripts/check-docs.mjs`、`pnpm format:check`、`pnpm lint` 和 `pnpm build`。

## 依赖与前端组件库
- 项目使用 `pnpm@10.14.0`;新增依赖后必须提交 `package.json` 和 `pnpm-lock.yaml`。
- 如果本地 `node_modules` 来自用户全局 pnpm store,安装依赖时可能需要显式使用现有 store-dir,避免 pnpm 试图切换到项目内 `.pnpm-store`。
- Hero UI v3 依赖 Tailwind CSS v4 和 React 19;升级这些依赖前要先验证 `@heroui/react`、`@heroui/styles` 的 peer dependency。
- Hero UI styles 不走老版 provider 配置,当前在 `src/index.css` 中按需 import base、component css、theme、utilities 和 variants。
- Hero UI 的 popover/select 动画依赖 `tw-animate-css`;移除或重排样式入口后,必须跑 `pnpm build` 捕获 Tailwind unknown utility 报错。
- 引入 Hero UI 后 `pnpm build` 可能出现 chunk size warning;这是包体提示,不是构建失败,但继续扩大组件库使用面时要评估 code splitting 或 Rollup `manualChunks`。

## 约束
- 改 Vite 端口、host 或 strictPort 前,确认 Tauri dev 配置和 [运行手册](../../run.md) 同步。
- 改 `check-docs.config.json` 时,同步 [AI 文件头规范](../../topics/ai-file-headers.md)。
- 改 `.oxfmtrc.json`、Oxlint/Oxfmt 脚本或 hook 范围时,同步本文件、[运行手册](../../run.md) 和 [测试策略](../../testing.md)。
- 改 `package.json`、前端组件库、Tailwind、测试配置或全局 CSS 时,至少跑 `pnpm test`、`pnpm build`、`pnpm lint`、`pnpm format:check` 和 `node scripts/check-docs.mjs`。
- hooks 是协作护栏,不是安全边界;关键规则仍要能通过测试、lint 或 pre-commit 复现。
