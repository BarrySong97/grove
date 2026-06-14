# Tooling 模块

## 职责
工具链模块记录项目启动、构建、文档检查和 agent hooks 的配置入口。它不是业务运行时,但会影响所有开发和验证流程。

## 文件
- `vite.config.ts`:Vite 配置,启用 React 与 Tailwind 插件,固定 dev server 为 `127.0.0.1:1420`。
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
- `pnpm lint` 使用 Oxlint 扫描项目 JS/TS/TSX 文件,提交前作为兜底。
- `pnpm format` 使用 Oxfmt 写回前端源码、配置和 hook 支持的文本文件;`pnpm format:check` 只检查不写入。
- `scripts/hooks/format-lint.mjs` 在 Write/Edit 后对单文件跑 Oxfmt,并对 JS/TS 文件追加 Oxlint。
- `scripts/hooks/pre-commit` 跑 `node scripts/check-docs.mjs`、`pnpm format:check`、`pnpm lint` 和 `pnpm build`。

## 约束
- 改 Vite 端口、host 或 strictPort 前,确认 Tauri dev 配置和 [运行手册](../../run.md) 同步。
- 改 `check-docs.config.json` 时,同步 [AI 文件头规范](../../topics/ai-file-headers.md)。
- 改 `.oxfmtrc.json`、Oxlint/Oxfmt 脚本或 hook 范围时,同步本文件、[运行手册](../../run.md) 和 [测试策略](../../testing.md)。
- hooks 是协作护栏,不是安全边界;关键规则仍要能通过测试、lint 或 pre-commit 复现。
