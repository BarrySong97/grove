# 0001 建立 harness 文档系统

## 背景
项目开始出现清晰的前端模块、共享组件和 Tauri 运行壳边界。后续 agent 协作需要稳定入口、就近模块上下文和一个可执行的文档同步检查。

## 决策
采用 `/Users/songtianjian/coding-md` 的 AI-Doc-System 结构:

- `CLAUDE.md` 只负责跳转到 `AGENTS.md`。
- `AGENTS.md` 作为 agent 唯一入口,放项目简介、红线、工作流和导航。
- 细节文档放在 `docs/`。
- 源码文件顶部保留轻量 `@purpose/@role/@deps/@gotcha` 文件头。
- `scripts/check-docs.mjs` 作为防漂移 sensor。
- `.claude/`、`.codex/` 和 `scripts/hooks/` 预置 hooks,但项目验证仍以手动 DoD 命令为底座。

## 后果
- 改源码时需要同步文件头和模块文档。
- `node scripts/check-docs.mjs` 成为收尾必跑命令。
- 真实 git/worktree 后端接入前,必须先补 spec 或 plan,避免 mock 行为被误当成生产边界。
