# Worktrees Layered Architecture Refactor

## 目标
参考 `frontend-backend-layered-architecture.md`,把 Worktrees 前端原型从单一 `model/` 拆成共享契约、领域规则、用例和 mock infrastructure,同时保持当前 UI 行为不变。

## 涉及文件
- `src/shared/contracts/worktrees/`
- `src/modules/worktrees/domain/`
- `src/modules/worktrees/use-cases/`
- `src/modules/worktrees/infrastructure/`
- `src/modules/worktrees/hooks/useWorktreePanelState.ts`
- `src/modules/worktrees/components/`
- `docs/modules/worktrees/README.md`
- `docs/modules/contracts/README.md`

## 方案
- 将 Worktree/Project/Command/Density 类型迁移到 `src/shared/contracts/worktrees/`,保持 browser-safe。
- 将 busy 判断、当前 worktree 选择、draft worktree 构造和命令 catalog 放入 `domain/`。
- 将排序、移动、新建、归档、切换和命令模拟状态变换放入 `use-cases/`。
- 将初始 mock 项目数据放入 `infrastructure/mock-projects-repository.ts`,明确其不是持久化或真实 git 状态。
- 保持 `components/` 和 `hooks/` 作为前端 presentation 层,只负责 React state、timer、toast 和事件编排。

## 任务清单
- [x] 新增共享 contracts 层。
- [x] 新增 Worktrees domain、use-cases、infrastructure 层。
- [x] 更新组件和 hook imports。
- [x] 删除旧 `src/modules/worktrees/model/`。
- [x] 同步模块文档、规范和 AGENTS 引用。
- [x] 跑格式化、lint、build 和 docs 检查。

## 验证方式
- `pnpm format`
- `pnpm lint`
- `pnpm build`
- `node scripts/check-docs.mjs`

## 回滚/风险
- 回滚时可恢复旧 `model/` 文件和组件 imports。
- 主要风险是 import 迁移遗漏或纯函数行为偏差;用 TypeScript build 和现有 UI 流程验证覆盖。
