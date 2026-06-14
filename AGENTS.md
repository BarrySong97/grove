# Grove — Agent 指南

**是什么**:Grove 是一个 macOS menu bar tray 应用原型,用于集中查看、排序和操作多个项目的 git worktree 面板。
**架构**:Tauri 2 + Rust 后端窗口/托盘壳 · React 19 + TypeScript + Tailwind CSS 前端 · 运行见 [docs/run.md](docs/run.md)

## 红线
- 不要把当前 worktree 数据当成真实 git 状态或持久化状态。现在 `src/modules/worktrees/model/data.ts` 是 mock 数据,行为是前端模拟。见 [docs/modules/worktrees/README.md](docs/modules/worktrees/README.md)。
- 新增前端 `invoke(...)` 命令时,必须同步 Rust handler、Tauri capability/权限和模块文档。见 [docs/modules/tauri-runtime/README.md](docs/modules/tauri-runtime/README.md)。
- 不要破坏 tray panel 的透明窗口约束:根节点、body、panel shell 必须保持透明背景、圆角裁切和隐藏滚动条。见 [design.md](design.md)。
- 改源码必须同步文件头和对应模块文档,收尾跑 `node scripts/check-docs.mjs`。这是 harness 的防漂移 sensor。

## 工作流
1. 先读相关模块文档 [docs/modules/](docs/modules/) 和待改文件的 `@purpose` 文件头。
2. 大改先在 [docs/plans/](docs/plans/) 写计划;需求澄清或产品行为变化写入 [docs/specs/](docs/specs/)。
3. 改代码时遵循 [docs/conventions.md](docs/conventions.md) 和 [design.md](design.md)。
4. 同步对应 `docs/modules/<module>/README.md`;跨模块行为写 [docs/topics/](docs/topics/);决策性变化补 [docs/decisions/](docs/decisions/)。
5. 按 [docs/testing.md](docs/testing.md) 真跑验证,至少跑受影响的最小命令。
6. 收尾跑 `node scripts/check-docs.mjs` 和可用的项目验证命令,清掉错误后再结束。

## 导航
- 应用入口:[docs/modules/app/](docs/modules/app/)
- Worktree 面板:[docs/modules/worktrees/](docs/modules/worktrees/)
- 共享 UI:[docs/modules/ui/](docs/modules/ui/) · 图标:[docs/modules/icons/](docs/modules/icons/) · 工具库:[docs/modules/lib/](docs/modules/lib/)
- Tauri 运行壳:[docs/modules/tauri-runtime/](docs/modules/tauri-runtime/) · 工具链:[docs/modules/tooling/](docs/modules/tooling/)
- 专题:[docs/topics/](docs/topics/) · 运行:[docs/run.md](docs/run.md) · 规范:[docs/conventions.md](docs/conventions.md) · 测试:[docs/testing.md](docs/testing.md) · 设计:[design.md](design.md)
